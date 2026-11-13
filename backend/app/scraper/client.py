"""Client HTTP + extraction des requêtes React Query embarquées dans les pages fdj.fr."""

from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

log = logging.getLogger(__name__)

BASE_URL = "https://www.fdj.fr"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "fr-FR,fr;q=0.9",
}

_PUSH_RE = re.compile(r"self\.__next_f\.push\((\[.*?\])\)</script>", re.S)
_ROW_RE = re.compile(r"(?m)^[0-9a-f]+:(?=[\[{])")
_DECODER = json.JSONDecoder()


@dataclass
class Page:
    url: str
    final_url: str
    # clé = (nom de la requête, paramètres JSON) -> données
    queries: dict[tuple[str, str], Any] = field(default_factory=dict)

    def get(self, name: str, **params: Any) -> Any:
        key = (name, json.dumps(params, separators=(",", ":"), ensure_ascii=False, sort_keys=True))
        return self.queries.get(key)


def _rsc_payload(html: str) -> str:
    parts = []
    for raw in _PUSH_RE.findall(html):
        try:
            arr = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if len(arr) > 1 and isinstance(arr[1], str):
            parts.append(arr[1])
    return "".join(parts)


def _collect_queries(obj: Any, out: dict) -> None:
    stack = [obj]
    while stack:
        cur = stack.pop()
        if isinstance(cur, dict):
            key = cur.get("queryKey")
            state = cur.get("state")
            if isinstance(key, list) and len(key) == 2 and isinstance(state, dict):
                try:
                    params = json.dumps(
                        json.loads(key[1]), separators=(",", ":"), ensure_ascii=False, sort_keys=True
                    )
                except (TypeError, json.JSONDecodeError):
                    params = str(key[1])
                out.setdefault((key[0], params), state.get("data"))
            stack.extend(cur.values())
        elif isinstance(cur, list):
            stack.extend(cur)


def parse_page(url: str, final_url: str, html: str) -> Page:
    payload = _rsc_payload(html)
    page = Page(url=url, final_url=final_url)
    for m in _ROW_RE.finditer(payload):
        try:
            obj, _ = _DECODER.raw_decode(payload, m.end())
        except json.JSONDecodeError:
            continue
        _collect_queries(obj, page.queries)
    return page


class FdjClient:
    """Client HTTP réutilisable (keep-alive, HTTP/1.1) avec retries exponentiels."""

    def __init__(self, timeout: float = 30.0, retries: int = 3):
        self.retries = retries
        self._http = httpx.Client(
            base_url=BASE_URL,
            headers=HEADERS,
            timeout=timeout,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=8, max_keepalive_connections=8),
        )

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "FdjClient":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def fetch(self, path: str) -> Page:
        last_exc: Exception | None = None
        for attempt in range(1, self.retries + 1):
            try:
                r = self._http.get(path)
                if r.status_code in (429, 500, 502, 503, 504):
                    raise httpx.HTTPStatusError(f"HTTP {r.status_code}", request=r.request, response=r)
                r.raise_for_status()
                page = parse_page(path, str(r.url), r.text)
                if not page.queries:
                    raise ValueError("aucune donnée RSC trouvée (structure de page modifiée ?)")
                return page
            except (httpx.HTTPError, ValueError) as exc:
                last_exc = exc
                if attempt < self.retries:
                    wait = 2 ** attempt
                    log.warning("%s : %s — nouvel essai dans %ss", path, exc, wait)
                    time.sleep(wait)
        raise RuntimeError(f"Échec de récupération de {path} : {last_exc}")
