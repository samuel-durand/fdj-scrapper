"""Orchestration : dernier tirage + dates disponibles + rattrapage des tirages manquants."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
import json
from datetime import date, datetime, timedelta

from .client import FdjClient, Page
from .games import GAMES, PARIS, Game, parse_announce, parse_dt
from .repository import DrawRepository

log = logging.getLogger(__name__)


@dataclass
class GameReport:
    added: int = 0
    updated: int = 0
    failed: list[str] = field(default_factory=list)
    latest: str | None = None


@dataclass
class Report:
    games: dict[str, GameReport] = field(default_factory=dict)
    requests: int = 0
    new_draws: list[tuple[str, dict]] = field(default_factory=list)      # (jeu, tirage)
    new_announces: list[tuple[str, dict]] = field(default_factory=list)  # (jeu, prochain tirage)

    @property
    def changed(self) -> bool:
        return bool(self.new_announces) or any(g.added or g.updated for g in self.games.values())


class Scraper:
    def __init__(self, repo: DrawRepository, workers: int = 4):
        self.repo = repo
        self.workers = workers

    # ------------------------------------------------------------------ fetch
    @staticmethod
    def _page_draws(page: Page, game: Game) -> list[dict]:
        """Tous les tirages du jeu présents dans la page (derniers tirages + journée affichée)."""
        seen: dict[str, dict] = {}
        for (name, params), data in page.queries.items():
            if name != "drawGameResultByDate" or not isinstance(data, list):
                continue
            try:
                if json.loads(params).get("gameName") != game.fdj_name:
                    continue
            except (TypeError, ValueError):
                continue
            for raw in data:
                if isinstance(raw, dict) and raw.get("numbers") and raw.get("date"):
                    d = game.parse(raw)
                    if d["id"] not in seen or d.get("payouts"):
                        seen[d["id"]] = d
        draws = list(seen.values())
        # Barème des gains (Keno, Amigo) : identique pour tous les tirages, la FDJ ne l'envoie
        # qu'une fois par page -> on le recopie sur les tirages qui n'ont qu'une référence.
        if any("payouts" in d for d in draws):
            ref = next((d["payouts"] for d in draws if d.get("payouts")), None)
            for d in draws:
                if not d.get("payouts"):
                    if ref:
                        d["payouts"] = ref
                    else:
                        d.pop("payouts", None)  # tirage incomplet : sera recomplété au prochain passage
        return draws

    def _fetch_overview(self, client: FdjClient, game: Game):
        # La page « résultats » redirige vers la dernière journée : pour Amigo / Crescendo,
        # elle contient déjà tous les tirages du jour.
        page = client.fetch(game.results_path)
        active = page.get("drawGameActiveDates", gameName=game.fdj_name) or []
        announce = page.get("drawGameAnnounce", gameName=game.fdj_name)
        # journée -> heure du dernier tirage de la journée
        last_of_day: dict[date, datetime] = {}
        for a in active:
            if a.get("date"):
                dt = parse_dt(a["date"])
                last_of_day[dt.date()] = max(dt, last_of_day.get(dt.date(), dt))
        return self._page_draws(page, game), last_of_day, parse_announce(game, announce)

    def _fetch_dated(self, client: FdjClient, game: Game, d: date) -> list[dict]:
        page = client.fetch(game.dated_path(d))
        # Vérifie que la FDJ n'a pas redirigé vers une autre journée
        return [x for x in self._page_draws(page, game) if x["date"] == d.isoformat()]

    def _missing_dates(self, game: Game, last_of_day: dict[date, datetime], latest: list[dict],
                       refresh: bool) -> list[date]:
        """Journées à (re)télécharger."""
        dates = sorted(last_of_day, reverse=True)
        if game.history_days:
            oldest = datetime.now(PARIS).date() - timedelta(days=game.history_days)
            dates = [d for d in dates if d >= oldest]
        if not game.intraday:
            known = self.repo.known(game.key)
            latest_ids = {d["id"] for d in latest}
            return [d for d in dates
                    if f"{game.prefix}-{d.isoformat()}" not in latest_ids
                    and (refresh or not known.get(f"{game.prefix}-{d.isoformat()}"))]
        # Plusieurs tirages par jour : journée absente de la base, ou dont le dernier tirage
        # (annoncé par la FDJ) manque — publié après notre dernier passage.
        stored_last = self.repo.last_draw_times(game.key)
        shown = {d["date"] for d in latest}

        def incomplete(d: date) -> bool:
            have = stored_last.get(d.isoformat())
            return have is None or parse_dt(have) < last_of_day[d] - timedelta(minutes=1)

        return [d for d in dates if d.isoformat() not in shown and (refresh or incomplete(d))]

    def _save(self, report: Report, game: Game, draws: list[dict]) -> None:
        added, updated = self.repo.upsert(game.key, draws)
        rep = report.games[game.key]
        rep.added += len(added)
        rep.updated += updated
        report.new_draws.extend((game.key, d) for d in added)

    # ------------------------------------------------------------------ run
    def run(self, games: list[str] | None = None, refresh: bool = False) -> Report:
        selected = [GAMES[k] for k in (games or GAMES)]
        report = Report()

        with FdjClient() as client, ThreadPoolExecutor(self.workers) as pool:
            # 1) Une page par jeu : dernier tirage + dates disponibles + prochain jackpot
            overviews = dict(zip(
                [g.key for g in selected],
                pool.map(lambda g: self._safe(self._fetch_overview, client, g), selected),
            ))
            report.requests += len(selected)

            # 2) Tirages manquants (ou incomplets) -> pages datées, en parallèle
            jobs: list[tuple[Game, date]] = []
            for game in selected:
                rep = report.games.setdefault(game.key, GameReport())
                ov = overviews[game.key]
                if isinstance(ov, Exception):
                    rep.failed.append(f"page principale : {ov}")
                    continue
                latest, dates, announce = ov
                if announce and self.repo.set_next_draw(game.key, announce):
                    report.new_announces.append((game.key, announce))
                jobs.extend((game, d) for d in self._missing_dates(game, dates, latest, refresh))
                self._save(report, game, latest)

            log.info("%d page(s) datée(s) à récupérer", len(jobs))
            results = pool.map(lambda j: (j, self._safe(self._fetch_dated, client, *j)), jobs)
            report.requests += len(jobs)
            for (game, d), res in results:
                if isinstance(res, Exception) or not res:
                    report.games[game.key].failed.append(f"{d.isoformat()} : {res or 'tirage introuvable'}")
                    continue
                self._save(report, game, res)

        for game in selected:
            newest = self.repo.list(game.key, limit=1)
            report.games[game.key].latest = newest[0]["date"] if newest else None

        self.repo.touch()
        return report

    @staticmethod
    def _safe(fn, *args):
        try:
            return fn(*args)
        except Exception as exc:  # noqa: BLE001 — on veut continuer les autres jeux
            log.error("%s%s : %s", fn.__name__, args[1:], exc)
            return exc
