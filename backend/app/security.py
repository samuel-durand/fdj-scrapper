"""Mots de passe (bcrypt, compatibles bcryptjs) et JWT (compatibles jsonwebtoken)."""

from __future__ import annotations

from datetime import timedelta
from functools import wraps

import bcrypt
import jwt
from flask import current_app, g, jsonify, request

from .db import get_db, now
from .serialize import oid


def hash_password(password: str) -> str:
    # bcryptjs tronque à 72 octets : on fait pareil pour rester compatible
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt(12)).decode()


def check_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode())
    except ValueError:
        return False


def _encode(user_id, secret: str, ttl: timedelta) -> str:
    issued = now()
    payload = {"id": str(user_id), "iat": int(issued.timestamp()), "exp": int((issued + ttl).timestamp())}
    return jwt.encode(payload, secret, algorithm="HS256")


def access_token(user_id) -> str:
    cfg = current_app.config["APP"]
    return _encode(user_id, cfg.jwt_secret, cfg.jwt_expire)


def refresh_token(user_id) -> str:
    cfg = current_app.config["APP"]
    return _encode(user_id, cfg.jwt_refresh_secret, cfg.jwt_refresh_expire)


def decode_refresh(token: str) -> dict:
    return jwt.decode(token, current_app.config["APP"].jwt_refresh_secret, algorithms=["HS256"])


def _fail(message: str, status: int = 401, **extra):
    return jsonify(success=False, message=message, **extra), status


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header.split(" ", 1)[1].strip() if header.startswith("Bearer") and " " in header else None
        if not token:
            return _fail("Non autorisé - Token manquant")
        try:
            payload = jwt.decode(token, current_app.config["APP"].jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return _fail("Token expiré", code="TOKEN_EXPIRED")
        except jwt.InvalidTokenError:
            return _fail("Token invalide")

        user_id = oid(payload.get("id"))
        user = get_db().users.find_one({"_id": user_id}, {"password": 0, "refreshToken": 0}) if user_id else None
        if not user:
            return _fail("Utilisateur non trouvé")
        if not user.get("isActive", True):
            return _fail("Compte désactivé")
        g.user = user
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @login_required
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if g.user.get("role") != "admin":
            return _fail("Accès refusé - Droits administrateur requis", 403)
        return fn(*args, **kwargs)

    return wrapper
