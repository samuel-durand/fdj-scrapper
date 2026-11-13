"""Mise à jour automatique des tirages dans le serveur web (pas de worker ni de GitHub Action).

Pensé pour les hébergements gratuits où il n'y a qu'un service web, qui peut être mis en veille
(Render : après ~15 min sans visite) :

  * un fil d'exécution en arrière-plan vérifie chaque minute s'il y a un tirage à récupérer,
    avec le calendrier du worker (heure annoncée par la FDJ + délai de publication, nouvel essai
    tant que le résultat n'est pas publié, Amigo toutes les 15 min) ;
  * au démarrage — donc au réveil du service — un passage complet rattrape tout ce qui a été
    publié pendant la veille ; il est renouvelé toutes les 12 h ;
  * plusieurs processus gunicorn : un verrou dans MongoDB garantit un seul scraping à la fois ;
  * l'état (dernier passage par jeu) est stocké en base : il survit aux redémarrages.
"""

from __future__ import annotations

import logging
import os
import random
import socket
import threading
from datetime import datetime, timedelta, timezone

from pymongo import ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError, PyMongoError

from .scraper import GAMES, DrawRepository
from .scraper.games import PARIS
from .worker import SCHEDULES, plan, run_once

log = logging.getLogger("autoupdate")

LOCK_ID = "autoupdate-lock"
STATE_ID = "autoupdate"
LOCK_TTL = timedelta(minutes=10)    # un scraping bloqué ne bloque pas les suivants indéfiniment
FULL_EVERY = timedelta(hours=12)    # passage complet (rattrapage, répartitions publiées tard)
CHECK_EVERY = 60                    # secondes entre deux vérifications


def _utc() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- verrou

def acquire(db: Database, owner: str, ttl: timedelta = LOCK_TTL) -> bool:
    """Prend le verrou s'il est libre (ou expiré). Atomique : un seul processus gagne."""
    now = _utc()
    try:
        doc = db.meta.find_one_and_update(
            {"_id": LOCK_ID, "$or": [{"expiresAt": {"$lt": now}}, {"owner": owner}]},
            {"$set": {"owner": owner, "expiresAt": now + ttl}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
    except DuplicateKeyError:  # verrou détenu par un autre processus
        return False
    return bool(doc) and doc.get("owner") == owner


def release(db: Database, owner: str) -> None:
    # Dans le passé : MongoDB arrondit les dates à la milliseconde, « maintenant » ne suffirait pas
    db.meta.update_one({"_id": LOCK_ID, "owner": owner}, {"$set": {"expiresAt": _utc() - timedelta(seconds=1)}})


# --------------------------------------------------------------------------- décision

def due_games(db: Database, now: datetime | None = None) -> tuple[list[str] | None, bool]:
    """Jeux à mettre à jour maintenant. Retourne (jeux, passage_complet) ;
    jeux = None signifie « tous » (passage complet)."""
    now = now or datetime.now(PARIS)
    state = db.meta.find_one({"_id": STATE_ID}) or {}
    last_full = state.get("lastFull")
    if last_full is None or now - last_full >= FULL_EVERY:
        return None, True

    last = {k: v.astimezone(PARIS) for k, v in (state.get("lastRun") or {}).items() if k in GAMES}
    due = []
    for job in plan(DrawRepository(db), now, set(), last):
        if not job.game or job.at > now:
            continue
        s = SCHEDULES[job.game]
        previous = last.get(job.game)
        # Tirage pas encore publié : on réessaie au rythme du jeu, pas à chaque minute
        if previous is None or now - previous >= (s.every or s.retry):
            due.append(job.game)
    return due, False


def refresh(db: Database, now: datetime | None = None) -> list[str]:
    """Un passage si nécessaire. Retourne les jeux mis à jour (vide si rien à faire)."""
    games, full = due_games(db, now)
    if not full and not games:
        return []
    log.info("🔄 Mise à jour %s", "complète" if full else "de " + ", ".join(GAMES[g].label for g in games))
    run_once(db, games)
    stamp = _utc()
    updated = list(GAMES) if full else games
    fields = {f"lastRun.{g}": stamp for g in updated}
    if full:
        fields["lastFull"] = stamp
    db.meta.update_one({"_id": STATE_ID}, {"$set": fields}, upsert=True)
    return updated


def tick(db: Database, owner: str) -> list[str]:
    """Une vérification protégée par le verrou (ne fait rien si un autre processus scrape)."""
    if not acquire(db, owner):
        return []
    try:
        return refresh(db)
    finally:
        release(db, owner)


# --------------------------------------------------------------------------- fil d'exécution

_started = False
_lock = threading.Lock()
_stop = threading.Event()


def start(db: Database, interval: int = CHECK_EVERY) -> bool:
    """Démarre la boucle en arrière-plan (une seule fois par processus)."""
    global _started
    with _lock:
        if _started:
            return False
        _started = True
    owner = f"{socket.gethostname()}-{os.getpid()}"

    def loop() -> None:
        # Petit décalage : les processus gunicorn ne se marchent pas dessus au démarrage
        _stop.wait(random.uniform(1, 5))
        log.info("🚀 Mise à jour automatique active (%s)", owner)
        while not _stop.is_set():
            try:
                tick(db, owner)
            except PyMongoError:
                log.exception("MongoDB indisponible, nouvel essai plus tard")
            except Exception:  # noqa: BLE001 — la boucle ne doit jamais s'arrêter
                log.exception("Échec de la mise à jour automatique")
            _stop.wait(interval)

    threading.Thread(target=loop, name="auto-update", daemon=True).start()
    return True


def stop() -> None:
    _stop.set()
