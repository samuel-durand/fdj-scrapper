"""Mise à jour automatique intégrée au serveur web (app/autoupdate.py)."""

from datetime import datetime, timedelta, timezone

import pytest

from app import autoupdate
from app.scraper import GAMES
from app.scraper.games import PARIS
from app.scraper.repository import DrawRepository

NOW = datetime(2026, 11, 13, 21, 15, tzinfo=PARIS)  # vendredi soir


@pytest.fixture
def calls(monkeypatch):
    """Remplace le vrai scraping (réseau) par un enregistreur d'appels."""
    seen = []
    monkeypatch.setattr(autoupdate, "run_once", lambda db, games=None: seen.append(games))
    monkeypatch.setattr(autoupdate, "import_archives",
                        lambda db: seen.append("archives") or type("R", (), {"added": {}})())
    return seen


def test_lock_single_owner(db):
    assert autoupdate.acquire(db, "web-1")
    assert not autoupdate.acquire(db, "web-2")          # déjà pris
    assert autoupdate.acquire(db, "web-1")              # le détenteur peut le renouveler
    autoupdate.release(db, "web-1")
    assert autoupdate.acquire(db, "web-2")              # libéré -> disponible


def test_lock_expires(db):
    assert autoupdate.acquire(db, "web-1", ttl=timedelta(seconds=-1))  # déjà expiré
    assert autoupdate.acquire(db, "web-2")


def test_first_run_is_full_then_nothing_due(db, calls):
    # Démarrage (ou réveil après la veille) : passage complet
    assert autoupdate.refresh(db, NOW) == list(GAMES)
    assert calls == [None, "archives"]           # + historique officiel, une seule fois
    state = db.meta.find_one({"_id": autoupdate.STATE_ID})
    assert set(state["lastRun"]) == set(GAMES) and state["lastFull"]


def test_due_games_follow_schedule(db, calls):
    repo = DrawRepository(db)
    # Prochain Loto annoncé à 20h55 : résultat attendu à partir de 21h25 (délai de 30 min)
    repo.set_next_draw("loto", {"date": "2026-11-13", "drawTime": "2026-11-13T20:55:00+01:00"})
    for k in GAMES:
        if k != "loto":  # les autres jeux : prochain tirage bien plus tard
            repo.set_next_draw(k, {"date": "2026-11-20", "drawTime": "2026-11-20T20:00:00+01:00"})
    last = NOW - timedelta(minutes=1)
    db.meta.insert_one({"_id": autoupdate.STATE_ID, "lastFull": last,
                        "lastRun": {k: last for k in GAMES}})

    games, full = autoupdate.due_games(db, NOW)              # 21h15 : trop tôt pour le Loto
    assert not full and "loto" not in games
    games, _ = autoupdate.due_games(db, NOW + timedelta(minutes=15))  # 21h30 : Loto attendu
    assert "loto" in games
    # Amigo : un passage groupé toutes les 15 min
    assert "amigo" not in autoupdate.due_games(db, NOW)[0]
    assert "amigo" in autoupdate.due_games(db, NOW + timedelta(minutes=15))[0]


def test_retry_is_throttled(db, calls):
    repo = DrawRepository(db)
    repo.set_next_draw("loto", {"date": "2026-11-13", "drawTime": "2026-11-13T20:55:00+01:00"})
    at = datetime(2026, 11, 13, 21, 30, tzinfo=PARIS)
    db.meta.insert_one({"_id": autoupdate.STATE_ID, "lastFull": at,
                        "lastRun": {"loto": at, "amigo": at}})
    # Loto pas encore publié, essai il y a 2 min : on attend le délai de nouvel essai (10 min)
    assert "loto" not in autoupdate.due_games(db, at + timedelta(minutes=2))[0]
    assert "loto" in autoupdate.due_games(db, at + timedelta(minutes=10))[0]


def test_full_pass_every_12h(db, calls):
    old = datetime.now(timezone.utc) - timedelta(hours=13)
    db.meta.insert_one({"_id": autoupdate.STATE_ID, "lastFull": old, "lastRun": {}})
    assert autoupdate.due_games(db)[1] is True


def test_tick_skips_when_locked(db, calls):
    assert autoupdate.acquire(db, "autre-processus")
    assert autoupdate.tick(db, "moi") == [] and calls == []


def test_archives_imported_once(db, calls):
    assert autoupdate.import_archives_once(db) is True
    assert autoupdate.import_archives_once(db) is False   # déjà fait
    assert calls == ["archives"]


def test_archives_retry_after_failure(db, monkeypatch):
    def boom(db):
        raise RuntimeError("fdj.fr indisponible")
    monkeypatch.setattr(autoupdate, "import_archives", boom)
    assert autoupdate.import_archives_once(db) is False
    state = db.meta.find_one({"_id": autoupdate.STATE_ID}) or {}
    assert "archivesImported" not in state                 # sera retenté au prochain passage complet
