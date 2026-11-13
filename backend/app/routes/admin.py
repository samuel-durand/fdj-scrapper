"""/api/admin : statistiques et gestion (réservé aux administrateurs)."""

from __future__ import annotations

import math
import re
from collections import Counter
from datetime import datetime, timedelta, timezone

from flask import Blueprint, g, jsonify, request
from pymongo import DESCENDING, ReturnDocument

from ..db import get_db, now
from ..security import admin_required
from ..serialize import oid, out
from . import body, bool_arg, fail, int_arg
from .auth import validate_user

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
USER_PROJECTION = {"password": 0, "refreshToken": 0}


def _utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _count_by(collection, since: datetime, fmt: str) -> Counter:
    return Counter(_utc(d["createdAt"]).strftime(fmt)
                   for d in collection.find({"createdAt": {"$gte": since}}, {"createdAt": 1}))


def _paginate(collection, query: dict, default_limit: int):
    page, limit = int_arg("page", 1, 1), int_arg("limit", default_limit, 1, 200)
    docs = list(collection.find(query).sort("createdAt", DESCENDING).skip((page - 1) * limit).limit(limit))
    total = collection.count_documents(query)
    return docs, {"page": page, "limit": limit, "total": total, "pages": math.ceil(total / limit)}


def _populate_users(docs: list[dict]) -> list[dict]:
    """Équivalent de .populate('userId', 'name email')."""
    ids = {d.get("userId") for d in docs}
    users = {u["_id"]: {"_id": u["_id"], "id": str(u["_id"]), "name": u.get("name"), "email": u.get("email")}
             for u in get_db().users.find({"_id": {"$in": list(ids)}}, {"name": 1, "email": 1})}
    return [{**out(d), "userId": users.get(d.get("userId"))} for d in docs]


@bp.get("/stats")
@admin_required
def stats():
    db = get_db()
    today = now().replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days, thirty_days = now() - timedelta(days=7), today - timedelta(days=29)
    month_start = today.replace(day=1)
    six_months = (month_start - timedelta(days=150)).replace(day=1)

    total_users = db.users.count_documents({})
    active_users = db.users.count_documents({"isActive": True})
    total_alerts = db.alerts.count_documents({})
    active_alerts = db.alerts.count_documents({"enabled": True})
    by_game = Counter(c["game"] for c in db.combinations.find({}, {"game": 1}))

    users_day = _count_by(db.users, thirty_days, "%Y-%m-%d")
    combos_day = _count_by(db.combinations, thirty_days, "%Y-%m-%d")
    alerts_day = _count_by(db.alerts, thirty_days, "%Y-%m-%d")
    daily = []
    for i in range(30):
        day = thirty_days + timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        daily.append({"date": key, "label": f"{day.day} {MOIS_COURTS[day.month - 1]}", "users": users_day[key],
                      "combinations": combos_day[key], "alerts": alerts_day[key]})

    users_month = _count_by(db.users, six_months, "%Y-%m")
    combos_month = _count_by(db.combinations, six_months, "%Y-%m")

    return jsonify(success=True, data={
        "users": {"total": total_users, "active": active_users, "inactive": total_users - active_users,
                  "recent": db.users.count_documents({"createdAt": {"$gte": seven_days}})},
        "combinations": {"total": db.combinations.count_documents({}),
                         "recent": db.combinations.count_documents({"createdAt": {"$gte": seven_days}}),
                         "byGame": [{"_id": k, "count": v} for k, v in by_game.items()]},
        "alerts": {"total": total_alerts, "active": active_alerts, "inactive": total_alerts - active_alerts},
        "timeSeries": {"daily": daily},
        "monthly": {"users": [{"_id": k, "count": v} for k, v in sorted(users_month.items())],
                    "combinations": [{"_id": k, "count": v} for k, v in sorted(combos_month.items())]},
    })


@bp.get("/users")
@admin_required
def users():
    db = get_db()
    query: dict = {}
    if search := request.args.get("search"):
        pattern = {"$regex": re.escape(search), "$options": "i"}
        query["$or"] = [{"name": pattern}, {"email": pattern}]
    if role := request.args.get("role"):
        query["role"] = role
    if (active := bool_arg("isActive")) is not None:
        query["isActive"] = active
    docs, pagination = _paginate(db.users, query, 20)
    ids = [u["_id"] for u in docs]
    combos = Counter(c["userId"] for c in db.combinations.find({"userId": {"$in": ids}}, {"userId": 1}))
    alerts = Counter(a["userId"] for a in db.alerts.find({"userId": {"$in": ids}}, {"userId": 1}))
    data = [{**out(u), "stats": {"combinations": combos[u["_id"]], "alerts": alerts[u["_id"]]}} for u in docs]
    return jsonify(success=True, data=data, pagination=pagination)


def _find_user(user_id):
    _id = oid(user_id)
    user = get_db().users.find_one({"_id": _id}, USER_PROJECTION) if _id else None
    return user, (None if user else fail("Utilisateur non trouvé", 404))


@bp.get("/users/<user_id>")
@admin_required
def user_detail(user_id):
    user, error = _find_user(user_id)
    if error:
        return error
    db = get_db()
    combos = [out(c) for c in db.combinations.find({"userId": user["_id"]}).sort("createdAt", DESCENDING).limit(10)]
    alerts = [out(a) for a in db.alerts.find({"userId": user["_id"]}).sort("createdAt", DESCENDING).limit(10)]
    return jsonify(success=True, data={"user": out(user), "combinations": combos, "alerts": alerts})


@bp.put("/users/<user_id>")
@admin_required
def update_user(user_id):
    user, error = _find_user(user_id)
    if error:
        return error
    data = body()
    role = data.get("role")
    if user["_id"] == g.user["_id"] and role and role != user.get("role"):
        return fail("Vous ne pouvez pas modifier votre propre rôle", 403)
    updates = {}
    if data.get("name"):
        updates["name"] = str(data["name"]).strip()
    if data.get("email"):
        updates["email"] = str(data["email"]).strip().lower()
    if role:
        if role not in ("user", "admin"):
            return fail("Rôle invalide")
        updates["role"] = role
    if "isActive" in data:
        if user["_id"] == g.user["_id"] and not data["isActive"]:
            return fail("Vous ne pouvez pas désactiver votre propre compte", 403)
        updates["isActive"] = bool(data["isActive"])
    if msg := validate_user(updates.get("name", user["name"]), updates.get("email", user["email"]), None):
        return fail(msg)
    if "email" in updates and get_db().users.find_one({"email": updates["email"], "_id": {"$ne": user["_id"]}}):
        return fail("Cet email est déjà utilisé")
    updates["updatedAt"] = now()
    user = get_db().users.find_one_and_update({"_id": user["_id"]}, {"$set": updates}, projection=USER_PROJECTION,
                                              return_document=ReturnDocument.AFTER)
    return jsonify(success=True, message="Utilisateur mis à jour", data=out(user))


@bp.delete("/users/<user_id>")
@admin_required
def delete_user(user_id):
    user, error = _find_user(user_id)
    if error:
        return error
    if user["_id"] == g.user["_id"]:
        return fail("Vous ne pouvez pas supprimer votre propre compte", 403)
    db = get_db()
    for name in ("combinations", "alerts", "notifications"):
        db[name].delete_many({"userId": user["_id"]})
    db.users.delete_one({"_id": user["_id"]})
    return jsonify(success=True, message="Utilisateur et données associées supprimés")


@bp.get("/combinations")
@admin_required
def combinations():
    query: dict = {}
    if game := request.args.get("game"):
        query["game"] = game
    if user_id := oid(request.args.get("userId")):
        query["userId"] = user_id
    docs, pagination = _paginate(get_db().combinations, query, 50)
    return jsonify(success=True, data=_populate_users(docs), pagination=pagination)


@bp.delete("/combinations/<combination_id>")
@admin_required
def delete_combination(combination_id):
    _id = oid(combination_id)
    if not _id or not get_db().combinations.delete_one({"_id": _id}).deleted_count:
        return fail("Combinaison non trouvée", 404)
    return jsonify(success=True, message="Combinaison supprimée")


@bp.get("/alerts")
@admin_required
def alerts():
    query: dict = {}
    if user_id := oid(request.args.get("userId")):
        query["userId"] = user_id
    if (active := bool_arg("isActive")) is not None:
        query["enabled"] = active
    docs, pagination = _paginate(get_db().alerts, query, 50)
    return jsonify(success=True, data=_populate_users(docs), pagination=pagination)


@bp.delete("/alerts/<alert_id>")
@admin_required
def delete_alert(alert_id):
    _id = oid(alert_id)
    if not _id or not get_db().alerts.delete_one({"_id": _id}).deleted_count:
        return fail("Alerte non trouvée", 404)
    return jsonify(success=True, message="Alerte supprimée")
