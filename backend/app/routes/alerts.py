"""/api/alerts : alertes de l'utilisateur."""

from __future__ import annotations

from flask import Blueprint, g, jsonify
from pymongo import DESCENDING, ReturnDocument

from ..db import get_db, now
from ..security import login_required
from ..serialize import oid, out
from . import GAME_KEYS, body, fail

bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")

ALERT_TYPES = ("jackpot_threshold", "favorite_numbers", "new_draw", "lucky_number_match")


def clean_config(config) -> dict:
    """Ne garde que les champs connus, avec les bons types."""
    config = config if isinstance(config, dict) else {}
    res = {}
    try:
        if config.get("threshold") is not None:
            res["threshold"] = float(config["threshold"])
        if config.get("numbers") is not None:
            res["numbers"] = [int(n) for n in config["numbers"]]
        if config.get("minMatches") is not None:
            res["minMatches"] = int(config["minMatches"])
        if config.get("luckyNumber") is not None:
            res["luckyNumber"] = int(config["luckyNumber"])
    except (TypeError, ValueError) as exc:
        raise ValueError("Configuration d'alerte invalide") from exc
    return res


def _validate(data: dict, partial: bool) -> tuple[dict, str | None]:
    updates = {}
    if "name" in data or not partial:
        name = str(data.get("name") or "").strip()
        if not name or len(name) > 100:
            return {}, "Le nom de l'alerte est requis (100 caractères max)"
        updates["name"] = name
    if "type" in data or not partial:
        if data.get("type") not in ALERT_TYPES:
            return {}, "Type d'alerte invalide"
        updates["type"] = data["type"]
    if "game" in data or not partial:
        if data.get("game") not in GAME_KEYS:
            return {}, "Jeu invalide"
        updates["game"] = data["game"]
    if "enabled" in data:
        updates["enabled"] = bool(data["enabled"])
    if "config" in data or not partial:
        try:
            updates["config"] = clean_config(data.get("config"))
        except ValueError as exc:
            return {}, str(exc)
    return updates, None


def _own_alert(alert_id):
    _id = oid(alert_id)
    alert = get_db().alerts.find_one({"_id": _id}) if _id else None
    if not alert:
        return None, fail("Alerte non trouvée", 404)
    if alert["userId"] != g.user["_id"]:
        return None, fail("Non autorisé", 403)
    return alert, None


@bp.get("")
@login_required
def list_alerts():
    alerts = [out(a) for a in get_db().alerts.find({"userId": g.user["_id"]}).sort("createdAt", DESCENDING)]
    return jsonify(success=True, count=len(alerts), data=alerts)


@bp.post("")
@login_required
def create_alert():
    data = body()
    if not data.get("name") or not data.get("type") or not data.get("game"):
        return fail("Nom, type et jeu requis")
    fields, error = _validate(data, partial=False)
    if error:
        return fail(error)
    ts = now()
    alert = {"userId": g.user["_id"], "enabled": True, **fields, "createdAt": ts, "updatedAt": ts}
    alert["_id"] = get_db().alerts.insert_one(alert).inserted_id
    return jsonify(success=True, message="Alerte créée avec succès", data=out(alert)), 201


@bp.put("/<alert_id>")
@login_required
def update_alert(alert_id):
    alert, error = _own_alert(alert_id)
    if error:
        return error
    fields, msg = _validate(body(), partial=True)
    if msg:
        return fail(msg)
    fields["updatedAt"] = now()
    alert = get_db().alerts.find_one_and_update(
        {"_id": alert["_id"]}, {"$set": fields}, return_document=ReturnDocument.AFTER
    )
    return jsonify(success=True, message="Alerte mise à jour", data=out(alert))


@bp.delete("/<alert_id>")
@login_required
def delete_alert(alert_id):
    alert, error = _own_alert(alert_id)
    if error:
        return error
    get_db().alerts.delete_one({"_id": alert["_id"]})
    return jsonify(success=True, message="Alerte supprimée")


@bp.patch("/<alert_id>/toggle")
@login_required
def toggle_alert(alert_id):
    alert, error = _own_alert(alert_id)
    if error:
        return error
    enabled = not alert.get("enabled", True)
    alert = get_db().alerts.find_one_and_update(
        {"_id": alert["_id"]}, {"$set": {"enabled": enabled, "updatedAt": now()}},
        return_document=ReturnDocument.AFTER,
    )
    return jsonify(success=True, message=f"Alerte {'activée' if enabled else 'désactivée'}", data=out(alert))
