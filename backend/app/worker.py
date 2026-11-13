"""Worker : récupère chaque tirage dès sa publication et déclenche les alertes.

  * au démarrage : passage complet (dernier tirage + rattrapage des trous) ;
  * planifie chaque jeu à l'heure exacte du prochain tirage annoncé par la FDJ
    (gère les Super Loto / Grand Loto exceptionnels), + RESULT_DELAY ;
  * tant que le résultat n'est pas publié : nouvel essai toutes les RETRY_EVERY ;
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
from datetime import date, datetime, time, timedelta

from pymongo.database import Database

from .scraper import GAMES, DrawRepository, Scraper
from .scraper.games import PARIS, parse_dt
from .services.alerts import AlertProcessor

log = logging.getLogger("worker")

RESULT_DELAY = timedelta(minutes=30)
RETRY_EVERY = timedelta(minutes=10)
GIVE_UP_AFTER = timedelta(hours=4)
MAINTENANCE_AT = time(9, 0)

# Calendrier de secours si la FDJ n'annonce pas le prochain tirage (lundi = 0)
FALLBACK = {
    "euromillions": ({1, 4}, time(21, 45)),
    "loto": ({0, 2, 5}, time(20, 55)),
    "eurodreams": ({0, 3}, time(21, 0)),
}

stop = threading.Event()


@dataclass(order=True)
class Job:
    at: datetime
    game: str          # "" = maintenance (tous les jeux)
    expected: date | None = None


def fallback_next(game: str, after: datetime) -> datetime:
    days, at = FALLBACK[game]
    for i in range(8):
        d = (after + timedelta(days=i)).date()
        dt = datetime.combine(d, at, PARIS)
        if d.weekday() in days and dt > after:
            return dt
    raise RuntimeError("calendrier invalide")


def plan(repo: DrawRepository, now: datetime, done: set[tuple[str, date]]) -> list[Job]:
    jobs = []
    next_draws = repo.next_draws()
    for key in GAMES:
        newest = repo.list(key, limit=1)
        latest = newest[0]["date"] if newest else ""
        nd = next_draws.get(key)
        draw_at = parse_dt(nd["drawTime"]) if nd and nd.get("drawTime") else None
        if draw_at is None or draw_at + GIVE_UP_AFTER < now:
            draw_at = fallback_next(key, now - GIVE_UP_AFTER)
        expected = draw_at.date()
        if expected.isoformat() <= latest or (key, expected) in done:
            draw_at = fallback_next(key, max(now, draw_at) + timedelta(hours=1))
            expected = draw_at.date()
        jobs.append(Job(max(draw_at + RESULT_DELAY, now), key, expected))

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
    done: set[tuple[str, date]] = set()

    while not stop.is_set():
        jobs = plan(repo, datetime.now(PARIS), done)
        for j in jobs:
            log.info("   %s  %s", j.at.strftime("%a %d/%m %H:%M"),
                     f"{GAMES[j.game].label} (tirage du {j.expected})" if j.game else "maintenance")
        job = jobs[0]
        if not sleep_until(job.at):
            break

        if not job.game:
            log.info("🧹 Maintenance quotidienne")
            run_once(db)
            continue

        label = GAMES[job.game].label
        deadline = datetime.combine(job.expected, time(0), PARIS) + timedelta(days=1, hours=2)
        log.info("🎯 %s : récupération du tirage du %s", label, job.expected)
        while not stop.is_set():
            run_once(db, [job.game])
            if repo.has_complete(job.game, job.expected.isoformat()):
                log.info("✅ %s du %s récupéré", label, job.expected)
                break
            if datetime.now(PARIS) + RETRY_EVERY > deadline:
                log.warning("⏹ %s du %s toujours absent, abandon", label, job.expected)
                break
            log.info("⏳ %s pas encore publié, nouvel essai dans %d min", label, RETRY_EVERY.total_seconds() // 60)
            if not sleep_until(datetime.now(PARIS) + RETRY_EVERY):
                break
        done.add((job.game, job.expected))

    log.info("👋 Worker arrêté")
