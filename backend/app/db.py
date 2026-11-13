"""Connexion MongoDB + index. Mêmes collections que l'ancien backend Mongoose."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import current_app
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database


def connect(uri: str, default_db: str = "loterie") -> Database:
    client = MongoClient(uri, tz_aware=True, serverSelectionTimeoutMS=10000)
    return client.get_default_database(default=default_db)


def get_db() -> Database:
    return current_app.extensions["mongo_db"]


def now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_indexes(db: Database) -> None:
    db.users.create_index("email", unique=True)
    db.alerts.create_index([("userId", ASCENDING), ("enabled", ASCENDING)])
    db.combinations.create_index([("userId", ASCENDING), ("game", ASCENDING), ("createdAt", DESCENDING)])
    db.combinations.create_index([("userId", ASCENDING), ("isFavorite", ASCENDING)])
    db.notifications.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
    # Suppression automatique après 30 jours (comme avant)
    db.notifications.create_index("createdAt", expireAfterSeconds=30 * 86400, name="createdAt_ttl")
    # Évite les doublons de notifications (une alerte = un message par tirage)
    db.notifications.create_index(
        "dedupKey", unique=True, partialFilterExpression={"dedupKey": {"$type": "string"}}
    )
    db.draws.create_index([("game", ASCENDING), ("date", DESCENDING)])
