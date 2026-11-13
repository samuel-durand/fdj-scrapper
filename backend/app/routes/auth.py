"""/api/auth : inscription, connexion, refresh, déconnexion, profil."""

from __future__ import annotations

import re

import jwt
from flask import Blueprint, g, jsonify
from pymongo.errors import DuplicateKeyError

from ..db import get_db, now
from ..security import (access_token, check_password, decode_refresh, hash_password, login_required,
                        refresh_token)
from ..serialize import oid, out
from . import body, fail

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$")

DEFAULT_PREFERENCES = {
    "favoriteGames": ["euromillions", "loto", "eurodreams"],
    "defaultTab": "euromillions",
    "notifications": True,
    "theme": "light",
}


def validate_user(name: str, email: str, password: str | None) -> str | None:
    if not 2 <= len(name) <= 50:
        return "Le nom doit contenir entre 2 et 50 caractères"
    if not EMAIL_RE.match(email):
        return "Email invalide"
    if password is not None and len(password) < 6:
        return "Le mot de passe doit contenir au moins 6 caractères"
    return None


def _session(user: dict, status: int, message: str):
    token, refresh = access_token(user["_id"]), refresh_token(user["_id"])
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"refreshToken": refresh}})
    return jsonify(success=True, message=message, data={"user": out(user), "token": token, "refreshToken": refresh}), status


@bp.post("/register")
def register():
    data = body()
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    if not name or not email or not password:
        return fail("Veuillez remplir tous les champs")
    if error := validate_user(name, email, password):
        return fail(error)

    db = get_db()
    if db.users.find_one({"email": email}, {"_id": 1}):
        return fail("Cet email est déjà utilisé")
    ts = now()
    user = {
        "name": name, "email": email, "password": hash_password(password), "role": "user",
        "preferences": dict(DEFAULT_PREFERENCES), "isActive": True, "createdAt": ts, "updatedAt": ts,
    }
    try:
        user["_id"] = db.users.insert_one(user).inserted_id
    except DuplicateKeyError:
        return fail("Cet email est déjà utilisé")
    return _session(user, 201, "Inscription réussie")


@bp.post("/login")
def login():
    data = body()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")
    if not email or not password:
        return fail("Email et mot de passe requis")

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not check_password(password, user.get("password")):
        return fail("Email ou mot de passe incorrect", 401)
    if not user.get("isActive", True):
        return fail("Compte désactivé", 401)

    ts = now()
    db.users.update_one({"_id": user["_id"]}, {"$set": {"lastLogin": ts, "updatedAt": ts}})
    user["lastLogin"] = user["updatedAt"] = ts
    return _session(user, 200, "Connexion réussie")


@bp.post("/refresh")
def refresh():
    token = body().get("refreshToken")
    if not token:
        return fail("Refresh token manquant", 401)
    try:
        payload = decode_refresh(token)
    except jwt.InvalidTokenError:
        return fail("Refresh token invalide ou expiré", 401)
    user_id = oid(payload.get("id"))
    user = get_db().users.find_one({"_id": user_id}, {"refreshToken": 1, "isActive": 1}) if user_id else None
    if not user or user.get("refreshToken") != token or not user.get("isActive", True):
        return fail("Refresh token invalide", 401)
    return jsonify(success=True, data={"token": access_token(user["_id"])})


@bp.post("/logout")
@login_required
def logout():
    get_db().users.update_one({"_id": g.user["_id"]}, {"$unset": {"refreshToken": ""}})
    return jsonify(success=True, message="Déconnexion réussie")


@bp.get("/me")
@login_required
def me():
    return jsonify(success=True, data={"user": out(g.user)})
