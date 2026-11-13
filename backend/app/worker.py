"""Worker : récupère chaque tirage dès sa publication et déclenche les alertes.

  * au démarrage : passage complet (dernier tirage + rattrapage des trous) ;
  * planifie chaque jeu à l'heure exacte du prochain tirage annoncé par la FDJ
    (gère les Super Loto / Grand Loto exceptionnels et les tirages horaires de Crescendo),
    + le délai de publication du jeu (SCHEDULES) ;
  * tant que le résultat n'est pas publié : nouvel essai régulier, puis abandon ;
  * Amigo (un tirage toutes les 5 min) : un passage groupé toutes les 15 min ;
  * passage de maintenance quotidien (MAINTENANCE_AT) pour compléter les
    répartitions de gains publiées tardivement ;
  * après chaque passage : création des notifications (alertes utilisateurs).
"""

from __future__ import annotations

import logging
import signal
import threading
import time as _time
from dataclasses import dataclass
from datetime import datetime, time, timedelta

from pymongo.database import Database

from .scraper import GAMES, DrawRepository, Scraper
from .scraper.games import PARIS, draw_id, parse_dt
from .services.alerts import AlertProcessor

log = logging.getLogger("worker")

MAINTENANCE_AT = time(9, 0)


@dataclass(frozen=True)
class Schedule:
    days: frozenset[int]          # jours de tirage (lundi = 0)
    times: tuple[time, ...]       # heures de tirage (calendrier de secours si la FDJ n'annonce rien)
    delay: timedelta              # délai avant publication des résultats
    retry: timedelta              # nouvel essai tant que le tirage n'est pas publié
    give_up: timedelta            # abandon
    every: timedelta | None = None  # jeux très fréquents (Amigo) : un passage groupé à intervalle fixe


ALL_DAYS = frozenset(range(7))
SCHEDULES = {
    "euromillions": Schedule(frozenset({1, 4}), (time(21, 45),), timedelta(minutes=30), timedelta(minutes=10), timedelta(hours=4)),
    "loto": Schedule(frozenset({0, 2, 5}), (time(20, 55),), timedelta(minutes=30), timedelta(minutes=10), timedelta(hours=4)),
    "eurodreams": Schedule(frozenset({0, 3}), (time(21, 0),), timedelta(minutes=30), timedelta(minutes=10), timedelta(hours=4)),
    "keno": Schedule(ALL_DAYS, (time(20, 35),), timedelta(minutes=15), timedelta(minutes=10), timedelta(hours=4)),
    "crescendo": Schedule(frozenset({5}), tuple(time(h, 0) for h in range(13, 20)),
                          timedelta(minutes=5), timedelta(minutes=5), timedelta(hours=1)),
    # Un tirage toutes les 5 min : on regroupe (la page du jour contient tous les tirages).
    "amigo": Schedule(ALL_DAYS, (), timedelta(minutes=2), timedelta(minutes=15), timedelta(minutes=30),
                      every=timedelta(minutes=15)),
}

stop = threading.Event()


@dataclass(order=True)
class Job:
    at: datetime
    game: str                  # "" = maintenance (tous les jeux)
    expected: str | None = None  # id du tirage attendu ("loto-2026-11-14", "cr-2026-11-14-1300")
    label: str = ""


def fallback_next(game: str, after: datetime) -> datetime:
    s = SCHEDULES[game]
    if s.every:
        return after + s.every
    for i in range(8):
        d = (after + timedelta(days=i)).date()
        if d.weekday() not in s.days:
            continue
        for t in s.times:
            dt = datetime.combine(d, t, PARIS)
            if dt > after:
                return dt
    raise RuntimeError("calendrier invalide")


def plan(repo: DrawRepository, now: datetime, done: set[str], last_run: dict[str, datetime]) -> list[Job]:
    jobs = []
    next_draws = repo.next_draws()
    for key, game in GAMES.items():
        s = SCHEDULES[key]
        if s.every:
            at = max(now, last_run.get(key, now - s.every) + s.every)
            jobs.append(Job(at, key, None, f"{game.label} (passage groupé)"))
            continue
        nd = next_draws.get(key)
        draw_at = parse_dt(nd["drawTime"]) if nd and nd.get("drawTime") else None
        if draw_at is None or draw_at + s.give_up < now:
            draw_at = fallback_next(key, now - s.give_up)
        expected = draw_id(game, draw_at)
        if expected in done or repo.is_complete(expected):
            draw_at = fallback_next(key, max(now, draw_at) + timedelta(minutes=1))
            expected = draw_id(game, draw_at)
        when = f"{draw_at:%d/%m}" + (f" {draw_at:%H:%M}" if game.intraday else "")
        jobs.append(Job(max(draw_at + s.delay, now), key, expected, f"{game.label} (tirage du {when})"))

    maint = datetime.combine(now.date(), MAINTENANCE_AT, PARIS)
    if maint <= now:
        maint += timedelta(days=1)
    jobs.append(Job(maint, ""))
    return sorted(jobs)


def sleep_until(when: datetime) -> bool:
    """Dort jusqu'à `when` (interruptible). Retourne False si arrêt demandé."""
    while not stop.is_set():
        remaining = (when - datetime.now(PARIS)).total_seconds()
        if remaining <= 0:
            return True
        stop.wait(min(remaining, 60))
    return False


def log_report(report, elapsed: float) -> None:
    for key, rep in report.games.items():
        log.info("%-12s +%d nouveaux, %d mis à jour, dernier tirage : %s",
                 GAMES[key].label, rep.added, rep.updated, rep.latest or "—")
        for f in rep.failed:
            log.warning("%-12s ⚠ %s", GAMES[key].label, f)
    log.info("✅ %d requête(s) en %.1fs", report.requests, elapsed)


def run_once(db: Database, games: list[str] | None = None, refresh: bool = False):
    """Un passage de scraping + alertes. Retourne le rapport (ou None si échec)."""
    t0 = _time.perf_counter()
    try:
        report = Scraper(DrawRepository(db)).run(games, refresh=refresh)
    except Exception:  # noqa: BLE001
        log.exception("Échec du scraping")
        return None
    log_report(report, _time.perf_counter() - t0)
    try:
        AlertProcessor(db).process(report.new_draws, report.new_announces)
    except Exception:  # noqa: BLE001
        log.exception("Échec du traitement des alertes")
    return report


def run_forever(db: Database) -> None:
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())

    repo = DrawRepository(db)
    log.info("🚀 Worker démarré")
    run_once(db)
    started = datetime.now(PARIS)
    last_run: dict[str, datetime] = {k: started for k in GAMES}
    done: set[str] = set()
    shown_plan = None

    while not stop.is_set():
        jobs = plan(repo, datetime.now(PARIS), done, last_run)
        # Le planning n'est affiché que s'il change (sinon Amigo le réimprimerait toutes les 15 min)
        current_plan = [(j.game, j.expected) for j in jobs]
        if current_plan != shown_plan:
            shown_plan = current_plan
            for j in jobs:
                log.info("   %s  %s", j.at.strftime("%a %d/%m %H:%M"), j.label or "maintenance")
        job = jobs[0]
        if not sleep_until(job.at):
            break

        if not job.game:
            log.info("🧹 Maintenance quotidienne")
            run_once(db)
            continue

        last_run[job.game] = datetime.now(PARIS)
        if job.expected is None:  # passage groupé (Amigo)
            run_once(db, [job.game])
            continue

        s = SCHEDULES[job.game]
        deadline = job.at - s.delay + s.give_up
        log.info("🎯 %s : récupération", job.label)
        while not stop.is_set():
            run_once(db, [job.game])
            if repo.is_complete(job.expected):
                log.info("✅ %s récupéré", job.label)
                break
            if datetime.now(PARIS) + s.retry > deadline:
                log.warning("⏹ %s toujours absent, abandon", job.label)
                break
            log.info("⏳ pas encore publié, nouvel essai dans %d min", s.retry.total_seconds() // 60)
            if not sleep_until(datetime.now(PARIS) + s.retry):
                break
        done.add(job.expected)

    log.info("👋 Worker arrêté")
