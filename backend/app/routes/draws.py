"""/api/draws : résultats des tirages (remplace resultats-cache.json).

Réponses mises en cache côté navigateur (60 s) + ETag : si rien n'a changé
depuis la dernière visite, le serveur répond 304 sans renvoyer les données.
"""

from __future__ import annotations

import hashlib
import re

from flask import Blueprint, jsonify, request

from ..db import get_db
from ..scraper.repository import DrawRepository
from ..serialize import iso
from . import DRAW_GAME_KEYS, fail, int_arg

bp = Blueprint("draws", __name__, url_prefix="/api/draws")

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _cached(payload: dict, meta: dict):
    resp = jsonify(payload)
    stamp = meta.get("lastUpdate")
    tag = hashlib.sha1(f"{iso(stamp) if stamp else ''}|{request.full_path}".encode()).hexdigest()
    resp.set_etag(tag)
    resp.cache_control.public = True
    resp.cache_control.max_age = 60
    return resp.make_conditional(request)


def _slim(draws: list[dict]) -> list[dict]:
    """Barème des gains (Keno, Amigo) identique d'un tirage à l'autre : envoyé avec le plus récent seulement."""
    return [d if i == 0 else {k: v for k, v in d.items() if k != "payouts"} for i, d in enumerate(draws)]


def _last_update(meta: dict) -> str | None:
    return iso(meta["lastUpdate"]) if meta.get("lastUpdate") else None


@bp.get("")
def all_games():
    """Tous les jeux d'un coup (même forme que l'ancien resultats-cache.json)."""
    repo = DrawRepository(get_db())
    meta = repo.meta()
    limit = int_arg("limit", 200, 1, 1000)
    payload = {"success": True, "lastUpdate": _last_update(meta), "nextDraws": meta.get("nextDraws", {})}
    for game in DRAW_GAME_KEYS:
        payload[game] = _slim(repo.list(game, limit=limit))
    return _cached(payload, meta)


@bp.get("/<game>")
def one_game(game):
    if game not in DRAW_GAME_KEYS:
        return fail("Jeu inconnu", 404)
    before = request.args.get("before")
    if before and not DATE_RE.match(before):
        return fail("Paramètre 'before' invalide (AAAA-MM-JJ)")
    repo = DrawRepository(get_db())
    meta = repo.meta()
    draws = _slim(repo.list(game, limit=int_arg("limit", 200, 1, 1000), before=before))
    return _cached({"success": True, "data": draws, "nextDraw": meta.get("nextDraws", {}).get(game),
                    "lastUpdate": _last_update(meta)}, meta)


@bp.get("/<game>/<date>")
def one_draw(game, date):
    if game not in DRAW_GAME_KEYS or not DATE_RE.match(date):
        return fail("Tirage introuvable", 404)
    repo = DrawRepository(get_db())
    draw = repo.get(game, date)
    if not draw:
        return fail("Tirage introuvable", 404)
    return _cached({"success": True, "data": draw}, repo.meta())
