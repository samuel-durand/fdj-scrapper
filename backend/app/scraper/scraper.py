"""Orchestration : dernier tirage + dates disponibles + rattrapage des tirages manquants."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import date

from .client import FdjClient
from .games import GAMES, Game, draw_date, parse_announce
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
    def _fetch_overview(self, client: FdjClient, game: Game):
        page = client.fetch(game.results_path)
        latest = page.get("drawGameResultByDate", gameName=game.fdj_name) or []
        active = page.get("drawGameActiveDates", gameName=game.fdj_name) or []
        announce = page.get("drawGameAnnounce", gameName=game.fdj_name)
        dates = sorted({draw_date(a["date"]) for a in active if a.get("date")}, reverse=True)
        return [game.parse(r) for r in latest if r.get("numbers")], dates, parse_announce(game, announce)

    def _fetch_dated(self, client: FdjClient, game: Game, d: date) -> dict | None:
        page = client.fetch(game.dated_path(d))
        data = page.get("drawGameResultByDate", gameName=game.fdj_name, date=d.strftime("%d/%m/%Y"))
        for raw in data or []:
            # Vérifie que la FDJ n'a pas redirigé vers un autre tirage
            if raw.get("numbers") and draw_date(raw["date"]) == d:
                return game.parse(raw)
        return None

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
                self._save(report, game, latest)

                known = self.repo.known(game.key)
                latest_ids = {d["id"] for d in latest}
                for d in dates:
                    draw_id = f"{game.prefix}-{d.isoformat()}"
                    if draw_id in latest_ids:
                        continue
                    if refresh or not known.get(draw_id):
                        jobs.append((game, d))

            log.info("%d page(s) datée(s) à récupérer", len(jobs))
            results = pool.map(lambda j: (j, self._safe(self._fetch_dated, client, *j)), jobs)
            report.requests += len(jobs)
            for (game, d), res in results:
                if isinstance(res, Exception) or res is None:
                    report.games[game.key].failed.append(f"{d.isoformat()} : {res or 'tirage introuvable'}")
                    continue
                self._save(report, game, [res])

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
