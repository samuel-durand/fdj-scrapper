"""/api/users : préférences, profil, mot de passe."""

from __future__ import annotations

from flask import Blueprint, g, jsonify
from pymongo import ReturnDocument

from ..db import get_db, now
from ..security import check_password, hash_password, login_required
from ..serialize import out
from . import DRAW_GAME_KEYS, body, fail
from .auth import validate_user

bp = Blueprint("users", __name__, url_prefix="/api/users")

PROJECTION = {"password": 0, "refreshToken": 0}


def _update(updates: dict):
    updates["updatedAt"] = now()
    return get_db().users.find_one_and_update(
        {"_id": g.user["_id"]}, {"$set": updates}, projection=PROJECTION, return_document=ReturnDocument.AFTER
    )


@bp.put("/preferences")
@login_required
def preferences():
    data = body()
    updates = {}
    if "favoriteGames" in data:
        games = data["favoriteGames"]
        if not isinstance(games, list) or any(x not in DRAW_GAME_KEYS for x in games):
            return fail("Jeux favoris invalides")
        updates["preferences.favoriteGames"] = games
    if "defaultTab" in data:
        if data["defaultTab"] not in DRAW_GAME_KEYS:
            return fail("Onglet par défaut invalide")
        updates["preferences.defaultTab"] = data["defaultTab"]
    if "notifications" in data:
        updates["preferences.notifications"] = bool(data["notifications"])
    if "theme" in data:
        if data["theme"] not in ("light", "dark"):
            return fail("Thème invalide")
        updates["preferences.theme"] = data["theme"]
    user = _update(updates)
    return jsonify(success=True, message="Préférences mises à jour", data={"user": out(user)})


@bp.put("/profile")
@login_required
def profile():
    data = body()
    name = str(data.get("name") or "").strip() or g.user["name"]
    email = str(data.get("email") or "").strip().lower() or g.user["email"]
    if error := validate_user(name, email, None):
        return fail(error)
    if email != g.user["email"] and get_db().users.find_one({"email": email, "_id": {"$ne": g.user["_id"]}}):
        return fail("Cet email est déjà utilisé")
    user = _update({"name": name, "email": email})
    return jsonify(success=True, message="Profil mis à jour", data={"user": out(user)})


@bp.put("/password")
@login_required
def password():
    data = body()
    current, new = data.get("currentPassword"), data.get("newPassword")
    if not current or not new:
        return fail("Mot de passe actuel et nouveau mot de passe requis")
    if len(str(new)) < 6:
        return fail("Le nouveau mot de passe doit contenir au moins 6 caractères")
    stored = get_db().users.find_one({"_id": g.user["_id"]}, {"password": 1})
    if not check_password(str(current), (stored or {}).get("password")):
        return fail("Mot de passe actuel incorrect", 401)
    _update({"password": hash_password(str(new))})
    return jsonify(success=True, message="Mot de passe modifié avec succès")
