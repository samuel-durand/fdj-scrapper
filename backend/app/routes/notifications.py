"""/api/notifications : centre de notifications."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, g, jsonify
from pymongo import DESCENDING, ReturnDocument

from ..db import get_db, now
from ..security import login_required
from ..serialize import oid, out
from . import GAME_KEYS, body, bool_arg, fail, int_arg

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def _unread() -> int:
    return get_db().notifications.count_documents({"userId": g.user["_id"], "read": False})


def _own(notification_id):
    _id = oid(notification_id)
    doc = get_db().notifications.find_one({"_id": _id}) if _id else None
    if not doc:
        return None, fail("Notification non trouvée", 404)
    if doc["userId"] != g.user["_id"]:
        return None, fail("Non autorisé", 403)
    return doc, None


@bp.get("")
@login_required
def list_notifications():
    query = {"userId": g.user["_id"]}
    if (read := bool_arg("read")) is not None:
        query["read"] = read
    limit = int_arg("limit", 50, minimum=1, maximum=200)
    docs = [out(n) for n in get_db().notifications.find(query).sort("createdAt", DESCENDING).limit(limit)]
    return jsonify(success=True, count=len(docs), unreadCount=_unread(), data=docs)


@bp.get("/unread-count")
@login_required
def unread_count():
    return jsonify(success=True, count=_unread())


@bp.patch("/mark-all-read")
@login_required
def mark_all_read():
    res = get_db().notifications.update_many(
        {"userId": g.user["_id"], "read": False}, {"$set": {"read": True, "updatedAt": now()}}
    )
    return jsonify(success=True, message=f"{res.modified_count} notification(s) marquée(s) comme lue(s)",
                   count=res.modified_count)


@bp.patch("/<notification_id>/read")
@login_required
def mark_read(notification_id):
    doc, error = _own(notification_id)
    if error:
        return error
    doc = get_db().notifications.find_one_and_update(
        {"_id": doc["_id"]}, {"$set": {"read": True, "updatedAt": now()}}, return_document=ReturnDocument.AFTER
    )
    return jsonify(success=True, message="Notification marquée comme lue", data=out(doc))


@bp.delete("/<notification_id>")
@login_required
def delete_one(notification_id):
    doc, error = _own(notification_id)
    if error:
        return error
    get_db().notifications.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Notification supprimée")


@bp.delete("")
@login_required
def delete_all():
    res = get_db().notifications.delete_many({"userId": g.user["_id"]})
    return jsonify(success=True, message=f"{res.deleted_count} notification(s) supprimée(s)", count=res.deleted_count)


@bp.post("")
@login_required
def create():
    data = body()
    if not data.get("message") or data.get("gameType") not in GAME_KEYS:
        return fail("Message et gameType requis")
    draw = data.get("draw") if isinstance(data.get("draw"), dict) else {}
    if isinstance(draw.get("date"), str):
        try:
            draw["date"] = datetime.fromisoformat(draw["date"].replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            draw.pop("date")
    ts = now()
    doc = {
        "userId": g.user["_id"], "alertId": oid(data.get("alertId")), "alertName": data.get("alertName"),
        "message": str(data["message"])[:500], "gameType": data["gameType"], "draw": draw, "read": False,
        "createdAt": ts, "updatedAt": ts,
    }
    doc["_id"] = get_db().notifications.insert_one(doc).inserted_id
    return jsonify(success=True, message="Notification créée", data=out(doc)), 201
