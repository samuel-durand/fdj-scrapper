"""Import de l'historique officiel FDJ (archives ZIP/CSV des pages « historique » de fdj.fr).

    python backend/manage.py import-archives            # tous les jeux compatibles
    python backend/manage.py import-archives --check    # analyse sans rien écrire

* Les archives sont découvertes sur les pages /jeux-de-tirage/<jeu>/historique (liens « Télécharger »).
* Seules les archives aux règles du jeu actuel sont importées, d'après leurs colonnes :
  Loto depuis 2008 (5 numéros + numéro chance ; avant : 6 numéros sur 49), Keno 16 numéros sur 56
  (avant nov. 2025 : 20 sur 70). Amigo n'est pas importé (≈ 200 tirages par jour depuis 2011).
* Un tirage déjà en base (récupéré par le scraper, plus complet) n'est jamais remplacé.
"""

from __future__ import annotations

import csv
import html
import io
import logging
import re
import zipfile
from dataclasses import dataclass, field
from datetime import date, datetime, time
from typing import Callable, Iterable

import httpx
from pymongo.database import Database

from .client import BASE_URL, HEADERS
from .games import GAMES, JOURS, PARIS, Game, _joker, draw_id, fmt_int, fmt_jackpot, fmt_money, french_date

log = logging.getLogger(__name__)

# Heure de tirage utilisée quand l'archive ne la donne pas (tri et affichage uniquement)
DEFAULT_TIME = {"euromillions": time(21, 0), "loto": time(20, 55), "eurodreams": time(21, 0), "keno": time(20, 35)}

ARCHIVE_GAMES = ("euromillions", "loto", "eurodreams", "keno", "crescendo")

_LINK = re.compile(r"<a\b[^>]*\bdownload=\"[^\"]*\"[^>]*>", re.S)
_ATTR = re.compile(r'([\w-]+)="([^"]*)"')


@dataclass
class Archive:
    name: str
    title: str
    url: str


@dataclass
class ImportReport:
    files: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    parsed: dict[str, int] = field(default_factory=dict)
    added: dict[str, int] = field(default_factory=dict)
    checked: dict[str, int] = field(default_factory=dict)       # tirages déjà en base comparés
    mismatches: dict[str, list[str]] = field(default_factory=dict)
    fixed: dict[str, int] = field(default_factory=dict)             # tirages en base corrigés


# --------------------------------------------------------------------------- lecture des valeurs

def _num(v: str | None) -> float | None:
    """'15000000,00' / '1 037 960' / '' -> nombre."""
    if v is None:
        return None
    v = v.strip().replace(" ", "").replace("\xa0", "").replace(" ", "").replace(",", ".")
    if not v:
        return None
    try:
        return float(v)
    except ValueError:
        return None


def _int(v: str | None) -> int | None:
    n = _num(v)
    return int(n) if n is not None else None


def _amount(v: str | None) -> str:
    n = _num(v)
    return fmt_money(n) if n else "Non disponible"


def _date(v: str) -> date:
    v = v.strip()
    if "/" in v:
        d, m, y = v.split("/")
        year = int(y)
        return date(year + 2000 if year < 100 else year, int(m), int(d))  # quelques lignes en JJ/MM/AA
    if len(v) == 8 and v.startswith(("19", "20")):   # AAAAMMJJ (anciennes archives)
        return date(int(v[:4]), int(v[4:6]), int(v[6:]))
    return date(int(v[4:]), int(v[2:4]), int(v[:2]))  # JJMMAAAA (Amigo)


def _time(v: str | None, default: time) -> time:
    m = re.match(r"(\d{1,2}):(\d{2})", (v or "").strip())
    return time(int(m.group(1)), int(m.group(2))) if m else default


def _plural(n: int, word: str) -> str:
    return f"{n} {word}{'s' if n > 1 else ''}"


def _base(game: Game, row: dict, d: date, t: time) -> dict:
    dt = datetime.combine(d, t, PARIS)
    out = {
        "id": draw_id(game, dt),
        "date": d.isoformat(),
        "drawTime": dt.isoformat(),
        "formattedDate": french_date(d),
        "day": JOURS[d.weekday()],
        "drawNumber": (row.get("annee_numero_de_tirage") or "").strip() or None,
    }
    if game.intraday:
        out["time"] = dt.strftime("%H:%M")
    return out


def _balls(row: dict, names: Iterable[str]) -> list[int]:
    return sorted(n for n in (_int(row.get(k)) for k in names) if n is not None)


def _first(row: dict, *keys: str) -> tuple[bool, str | None]:
    for k in keys:
        if k in row:
            return True, row[k]
    return False, None


def _ranks(row: dict, game_suffix: str = "", draw_suffix: str = "") -> list[tuple[int, int | None, int | None, str]]:
    """[(rang, gagnants France, gagnants Europe, montant)] d'après les colonnes présentes.

    Variantes rencontrées : nombre_de_gagnant_au_rang1, …_rang1_en_france / _en_europe,
    …_rang1_Euro_Millions_en_france, …_rang_1_second_tirage."""
    out = []
    i = 1
    while True:
        count_keys = [f"nombre_de_gagnant_au_rang{sep}{i}{suffix}{draw_suffix}"
                      for sep in ("", "_") for suffix in (game_suffix, "")]
        found, fr = _first(row, *[k + "_en_france" for k in count_keys], *count_keys)
        if not found:
            return out
        _, eu = _first(row, *[k + "_en_europe" for k in count_keys])
        _, amount = _first(row, f"rapport_du_rang{i}{game_suffix}{draw_suffix}", f"rapport_du_rang{i}{draw_suffix}")
        out.append((i, _int(fr), _int(eu) if eu is not None else None, amount))
        i += 1


# --------------------------------------------------------------------------- jeux

# Rangs actuels (identiques aux libellés du scraper)
EM_LABELS = ["5 numéros + 2 étoiles", "5 numéros + 1 étoile", "5 numéros", "4 numéros + 2 étoiles",
             "4 numéros + 1 étoile", "3 numéros + 2 étoiles", "4 numéros", "2 numéros + 2 étoiles",
             "3 numéros + 1 étoile", "3 numéros", "1 numéro + 2 étoiles", "2 numéros + 1 étoile", "2 numéros"]
LOTO_LABELS_9 = ["5 numéros + numéro chance", "5 numéros", "4 numéros + numéro chance", "4 numéros",
                 "3 numéros + numéro chance", "3 numéros", "2 numéros + numéro chance", "2 numéros",
                 "0 ou 1 numéro + numéro chance"]
# Loto de 2008 à 2019 : 6 rangs
LOTO_LABELS_6 = ["5 numéros + numéro chance", "5 numéros", "4 numéros", "3 numéros", "2 numéros",
                 "0 ou 1 numéro + numéro chance"]
ED_LABELS = ["6 numéros + dream number", "6 numéros", "5 numéros", "4 numéros", "3 numéros", "2 numéros"]
CRESCENDO_LABELS = ["10 bons numéros", "9 bons numéros + lettre", "9 bons numéros", "8 bons numéros + lettre",
                    "8 bons numéros", "7 bons numéros + lettre", "7 bons numéros", "6 bons numéros + lettre",
                    "6 bons numéros", "Lettre seule"]


def _label(labels: list[str] | None, rank: int) -> str:
    # Formats anciens dont l'ordre des rangs n'est pas documenté : libellé neutre
    return labels[rank - 1] if labels and rank <= len(labels) else f"Rang {rank}"


def parse_euromillions(game: Game, row: dict, name: str) -> dict | None:
    if "etoile_1" not in row:
        return None
    d = _date(row["date_de_tirage"])
    out = _base(game, row, d, DEFAULT_TIME["euromillions"])
    out["numbers"] = _balls(row, (f"boule_{i}" for i in range(1, 6)))
    out["stars"] = _balls(row, ("etoile_1", "etoile_2"))
    ranks = _ranks(row, "_Euro_Millions")
    labels = EM_LABELS if len(ranks) == 13 else None
    out["winningsDistribution"] = [
        {"rank": r, "combination": _label(labels, r), "winners": fmt_int(fr), "winnersEurope": fmt_int(eu),
         "amount": _amount(a)}
        for r, fr, eu, a in ranks
    ]
    code = (row.get("numero_My_Million") or "").strip()
    out["myMillionCode"] = code or None
    out["jackpotAmount"] = None
    out["jackpot"] = "Non disponible"
    return out


def parse_loto(game: Game, row: dict, name: str) -> dict | None:
    if "numero_chance" not in row or "boule_6" in row:  # avant 2008 : 6 numéros sur 49
        return None
    d = _date(row["date_de_tirage"])
    out = _base(game, row, d, DEFAULT_TIME["loto"])
    out["numbers"] = _balls(row, (f"boule_{i}" for i in range(1, 6)))
    out["luckyNumber"] = _int(row.get("numero_chance"))
    ranks = _ranks(row)
    labels = LOTO_LABELS_9 if len(ranks) == 9 else LOTO_LABELS_6 if len(ranks) == 6 else None
    out["winningsDistribution"] = [
        {"rank": r, "combination": _label(labels, r), "winners": fmt_int(w), "amount": _amount(a)}
        for r, w, _, a in ranks
    ]
    second = _balls(row, (f"boule_{i}_second_tirage" for i in range(1, 6)))
    out["secondDraw"] = second or None
    # 2nd tirage : rang 1 = 5 bons numéros … rang 4 = 2 bons numéros
    out["secondDrawDistribution"] = [
        {"rank": r, "combination": _plural(6 - r, "numéro"), "winners": fmt_int(w), "amount": _amount(a)}
        for r, w, _, a in _ranks(row, draw_suffix="_second_tirage")
    ]
    codes = row.get("codes_gagnants") or ""
    out["codesGagnants"] = [c.strip() for c in codes.split(",") if c.strip()]
    joker = row.get("numero_jokerplus") or row.get("numero_7") or ""
    out["jokerPlus"] = _joker(joker.replace(" ", ""))
    lower = name.lower()
    out["lotoType"] = "superloto" if "super" in lower or lower.startswith("sloto") else (
        "grandloto" if "grand" in lower or "noel" in lower else "loto")
    first = ranks[0][3] if ranks else None
    out["jackpotAmount"] = _num(first) or None
    out["jackpot"] = fmt_jackpot(out["jackpotAmount"])
    return out


def parse_eurodreams(game: Game, row: dict, name: str) -> dict | None:
    if "numero_dream" not in row:
        return None
    d = _date(row["date_de_tirage"])
    out = _base(game, row, d, DEFAULT_TIME["eurodreams"])
    out["numbers"] = _balls(row, (f"boule_{i}" for i in range(1, 7)))
    out["dreamNumber"] = _int(row.get("numero_dream"))
    dist = []
    for r, fr, eu, a in _ranks(row, "_Euro_Dreams"):
        n = _num(a)
        if r == 1:  # rente de 30 ans
            amount = f"{fmt_money(n)} par mois pendant 30 ans" if n else "Non disponible"
        elif r == 2:  # rente de 5 ans
            amount = f"{fmt_money(n)} par mois pendant 5 ans" if n else "Non disponible"
        else:
            amount = _amount(a)
        dist.append({"rank": r, "combination": _label(ED_LABELS, r), "winners": fmt_int(fr),
                     "winnersEurope": fmt_int(eu), "amount": amount})
    out["winningsDistribution"] = dist
    out["jackpotAmount"] = None
    out["jackpot"] = "Non disponible"
    return out


def parse_keno(game: Game, row: dict, name: str) -> dict | None:
    if "boule16" not in row or "boule17" in row:  # avant nov. 2025 : 20 numéros sur 70
        return None
    d = _date(row["date_de_tirage"])
    out = _base(game, row, d, DEFAULT_TIME["keno"])
    out["numbers"] = _balls(row, (f"boule{i}" for i in range(1, 17)))
    out["multiplier"] = _int(row.get("multiplicateur"))
    joker = row.get("numero_jokerplus") or row.get("numero_7") or ""
    out["jokerPlus"] = _joker(joker.replace(" ", ""))
    out["jackpotAmount"] = None
    return out


def parse_crescendo(game: Game, row: dict, name: str) -> dict | None:
    if "lettre" not in row:
        return None
    d = _date(row["date_de_tirage"])
    out = _base(game, row, d, _time(row.get("heure_de_tirage"), time(13, 0)))
    out["intradayNumber"] = None
    out["numbers"] = _balls(row, (f"boule{i}" for i in range(1, 11)))
    out["letter"] = (row.get("lettre") or "").strip() or None
    ranks = _ranks(row)
    out["winningsDistribution"] = [
        {"rank": r, "combination": _label(CRESCENDO_LABELS, r), "winners": fmt_int(w),
         "amount": fmt_money(_num(a) or 0)}
        for r, w, _, a in ranks
    ]
    first = _num(ranks[0][3]) if ranks else None
    out["jackpotAmount"] = first or None
    out["jackpot"] = fmt_jackpot(out["jackpotAmount"])
    return out


PARSERS: dict[str, Callable[[Game, dict, str], dict | None]] = {
    "euromillions": parse_euromillions, "loto": parse_loto, "eurodreams": parse_eurodreams,
    "keno": parse_keno, "crescendo": parse_crescendo,
}


# --------------------------------------------------------------------------- téléchargement

def discover(http: httpx.Client, game: Game) -> list[Archive]:
    """Liens « Télécharger » de la page historique du jeu."""
    r = http.get(f"{BASE_URL}/jeux-de-tirage/{game.slug}/historique")
    r.raise_for_status()
    out = []
    for tag in _LINK.findall(r.text):
        a = dict(_ATTR.findall(tag))
        if a.get("href", "").startswith("http"):
            out.append(Archive(a.get("download", ""), html.unescape(a.get("title", "")), html.unescape(a["href"])))
    return out


def read_csv(content: bytes) -> list[tuple[str, list[dict]]]:
    """Contenu d'une archive ZIP -> [(nom du fichier, lignes)]."""
    out = []
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        for info in z.infolist():
            if not info.filename.lower().endswith(".csv"):
                continue
            raw = z.read(info)
            try:
                text = raw.decode("utf-8-sig")
            except UnicodeDecodeError:
                text = raw.decode("latin-1")
            rows = list(csv.DictReader(io.StringIO(text), delimiter=";"))
            out.append((info.filename, rows))
    return out


def parse_archive(game: Game, name: str, rows: list[dict]) -> list[dict] | None:
    """Lignes d'un CSV -> tirages. None si l'archive ne suit pas les règles actuelles du jeu."""
    parser = PARSERS[game.key]
    draws = []
    for row in rows:
        row = {(k or "").strip(): (v if v is not None else "") for k, v in row.items()}
        try:
            d = parser(game, row, name)
        except (KeyError, ValueError):
            continue
        if d is None:
            return None if not draws else draws
        if d["numbers"]:
            draws.append(d)
    return draws


# --------------------------------------------------------------------------- import

def _norm(v) -> str:
    """Comparaison insensible aux espaces (« 1 126 » avec espace fine ou normale)."""
    return "".join(str(v or "").split())


def _compare(db_draw: dict, draw: dict) -> str | None:
    """Différence entre un tirage en base et l'archive officielle (None si identiques)."""
    for key in ("numbers", "stars", "luckyNumber", "dreamNumber", "letter"):
        if draw.get(key) in (None, []):
            continue  # rien d'officiel à comparer
        # une valeur absente en base (ex. numéro Dream non récupéré par l'ancien cache) compte aussi
        if db_draw.get(key) != draw[key]:
            return f"{key} : base {db_draw.get(key)} / archive {draw[key]}"
    ours = db_draw.get("winningsDistribution") or []
    theirs = draw.get("winningsDistribution") or []
    if ours and theirs:
        if len(ours) != len(theirs):
            return f"{len(ours)} rangs en base / {len(theirs)} dans l'archive"
        for a, b in zip(ours, theirs):
            if _norm(a.get("combination")) != _norm(b["combination"]) or _norm(a.get("winners")) != _norm(b["winners"]):
                return f"rang {b['rank']} : base {a.get('combination')} {a.get('winners')} / archive {b['combination']} {b['winners']}"
    return None


def import_archives(db: Database, games: Iterable[str] = ARCHIVE_GAMES, check: bool = False,
                    http: httpx.Client | None = None) -> ImportReport:
    report = ImportReport()
    own_http = http is None
    http = http or httpx.Client(headers=HEADERS, follow_redirects=True, timeout=60)
    try:
        for key in games:
            game = GAMES[key]
            existing = {d["_id"]: d for d in db.draws.find({"game": key})}
            new: dict[str, dict] = {}
            fixes: dict[str, dict] = {}
            for archive in discover(http, game):
                r = http.get(archive.url)
                if r.status_code != 200:
                    report.skipped.append(f"{archive.name} : HTTP {r.status_code}")
                    continue
                for filename, rows in read_csv(r.content):
                    draws = parse_archive(game, archive.name or filename, rows)
                    if draws is None:
                        report.skipped.append(f"{archive.title} (règles différentes)")
                        continue
                    report.files.append(f"{archive.title} : {len(draws)} tirages")
                    for d in draws:
                        if d["id"] in existing:
                            report.checked[key] = report.checked.get(key, 0) + 1
                            diff = _compare(existing[d["id"]], d)
                            if diff:
                                # La base est fausse (ancien cache) : l'archive officielle fait foi
                                report.mismatches.setdefault(key, []).append(f"{d['id']} {diff}")
                                fixes.setdefault(d["id"], d)
                        else:
                            new.setdefault(d["id"], d)  # 1er fichier rencontré : le plus récent
            report.parsed[key] = len(new) + report.checked.get(key, 0)
            report.added[key] = len(new)
            report.fixed[key] = len(fixes)
            if not check:
                stamp = datetime.now(PARIS)
                doc = lambda d: {**d, "_id": d["id"], "game": key, "source": "archive", "updatedAt": stamp}  # noqa: E731
                if new:
                    db.draws.insert_many([doc(d) for d in new.values()], ordered=False)
                for d in fixes.values():
                    db.draws.replace_one({"_id": d["id"]}, doc(d))
            log.info("%-12s %d tirages ajoutés, %d corrigés depuis les archives (%d déjà en base)",
                     game.label, len(new), len(fixes), report.checked.get(key, 0))
    finally:
        if own_http:
            http.close()
    return report
