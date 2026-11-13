"""Sérialisation JSON compatible avec ce que renvoyait Mongoose."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from flask.json.provider import DefaultJSONProvider

PRIVATE_FIELDS = ("password", "refreshToken", "__v", "dedupKey")


def iso(dt: datetime) -> str:
    """Format JS : 2026-11-13T14:30:00.000Z"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class MongoJSONProvider(DefaultJSONProvider):
    ensure_ascii = False
    sort_keys = False

    @staticmethod
    def default(o: Any) -> Any:
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return iso(o)
        if isinstance(o, date):
            return o.isoformat()
        return DefaultJSONProvider.default(o)


def out(doc: dict | None, hide: tuple[str, ...] = PRIVATE_FIELDS) -> dict | None:
    """Document Mongo -> JSON public. Expose `_id` ET `id` (le front utilise les deux)."""
    if doc is None:
        return None
    res = {k: v for k, v in doc.items() if k not in hide}
    if "_id" in res:
        res["id"] = str(res["_id"])
    return res


def oid(value: Any) -> ObjectId | None:
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        return None
