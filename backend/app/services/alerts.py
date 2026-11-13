"""Évaluation des alertes côté serveur.

Appelé par le scraper/worker dès qu'un tirage (ou un jackpot) arrive en base :
les notifications sont créées même si l'utilisateur n'ouvre pas le site.
Remplace `checkNewDraws` qui tournait dans le navigateur.
"""

from __future__ import annotations

import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any, Iterable

from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

log = logging.getLogger(__name__)

LABELS = {"euromillions": "EuroMillions", "loto": "Loto", "eurodreams": "EuroDreams"}

# Les tirages plus anciens (rattrapage d'historique, import) ne déclenchent pas d'alerte :
# sinon un premier lancement enverrait des dizaines de notifications d'un coup.
MAX_DRAW_AGE = timedelta(days=3)


def parse_amount(text: Any) -> float | None:
    """'17 millions €' -> 17e6 ; '1,5 million €' -> 1.5e6 ; '20 000 €' -> 20000."""
    if isinstance(text, (int, float)):
        return float(text)
    if not text:
        return None
    s = str(text).replace(" ", " ").replace(" ", " ")
    m = re.search(r"(\d[\d ]*(?:,\d+)?)", s)
    if not m:
        return None
    value = float(m.group(1).replace(" ", "").replace(",", "."))
    if re.search(r"milliard", s, re.I):
        value *= 1e9
    elif re.search(r"million|\bM\b|M€", s, re.I):
        value *= 1e6
    return value


def _cfg(alert: dict, key: str) -> Any:
    """Les anciennes alertes stockaient parfois la config à la racine."""
    cfg = alert.get("config") or {}
    return cfg.get(key) if cfg.get(key) is not None else alert.get(key)


def _complementary(game: str, draw: dict) -> list[int]:
    if game == "euromillions":
        return list(draw.get("stars") or [])
    value = draw.get("luckyNumber") if game == "loto" else draw.get("dreamNumber")
    return [value] if value is not None else []


def evaluate_draw(alert: dict, game: str, draw: dict) -> str | None:
    """Message de notification si l'alerte se déclenche pour ce tirage, sinon None."""
    kind = alert.get("type")
    label = LABELS.get(game, game)
    if kind == "new_draw":
        numbers = " - ".join(str(n) for n in draw.get("numbers", []))
        extra = " / ".join(str(n) for n in _complementary(game, draw))
        return f"🆕 Résultats {label} du {draw.get('formattedDate', draw.get('date'))} : {numbers}" + (
            f" + {extra}" if extra else ""
        )
    if kind == "favorite_numbers":
        wanted = {int(n) for n in (_cfg(alert, "numbers") or [])}
        matched = sorted(wanted & set(draw.get("numbers", [])))
        if wanted and len(matched) >= int(_cfg(alert, "minMatches") or 1):
            return f"🎯 {len(matched)} de vos numéros favoris sont sortis au {label} : {', '.join(map(str, matched))} !"
        return None
    if kind == "lucky_number_match":
        lucky = _cfg(alert, "luckyNumber")
        if lucky is not None and int(lucky) in _complementary(game, draw):
            name = {"euromillions": "étoile", "loto": "numéro chance", "eurodreams": "Dream Number"}[game]
            return f"⭐ Votre {name} {lucky} est sorti au {label} !"
        return None
    return None


def evaluate_announce(alert: dict, game: str, announce: dict) -> str | None:
    if alert.get("type") != "jackpot_threshold":
        return None
    threshold = parse_amount(_cfg(alert, "threshold"))
    amount = parse_amount(announce.get("jackpot"))
    if threshold and amount and amount >= threshold:
        return (f"🎰 Jackpot {LABELS.get(game, game)} : {announce.get('prefix') or ''} {announce['jackpot']} "
                f"pour le tirage du {announce.get('formattedDate')} !").replace("  ", " ")
    return None


def _draw_summary(game: str, draw: dict) -> dict:
    summary: dict[str, Any] = {"numbers": draw.get("numbers", []), "jackpot": draw.get("jackpot")}
    if draw.get("date"):
        summary["date"] = datetime.fromisoformat(draw["date"]).replace(tzinfo=timezone.utc)
    if game == "euromillions":
        summary["stars"] = draw.get("stars", [])
    elif game == "loto":
        summary["luckyNumber"] = draw.get("luckyNumber")
    else:
        summary["dreamNumber"] = draw.get("dreamNumber")
    return summary


class AlertProcessor:
    def __init__(self, db: Database):
        self.db = db
        self._users: dict[Any, dict | None] = {}

    def _user_ok(self, user_id) -> bool:
        if user_id not in self._users:
            self._users[user_id] = self.db.users.find_one({"_id": user_id}, {"isActive": 1, "preferences": 1})
        user = self._users[user_id]
        return bool(user) and user.get("isActive", True) and (user.get("preferences") or {}).get("notifications", True)

    def _notify(self, alert: dict, game: str, message: str, key: str, draw: dict) -> bool:
        now = datetime.now(timezone.utc)
        doc = {
            "userId": alert["userId"],
            "alertId": alert["_id"],
            "alertName": alert.get("name"),
            "message": message,
            "gameType": game,
            "draw": draw,
            "read": False,
            "dedupKey": f"{alert['_id']}:{key}",
            "createdAt": now,
            "updatedAt": now,
        }
        try:
            self.db.notifications.insert_one(doc)
            return True
        except DuplicateKeyError:
            return False

    def _alerts(self, game: str) -> list[dict]:
        return [a for a in self.db.alerts.find({"game": game, "enabled": True}) if self._user_ok(a.get("userId"))]

    def process(self, new_draws: Iterable[tuple[str, dict]] = (), announces: Iterable[tuple[str, dict]] = (),
                today: date | None = None) -> int:
        created = 0
        oldest = ((today or datetime.now(timezone.utc).date()) - MAX_DRAW_AGE).isoformat()
        for game, draw in new_draws:
            if draw.get("date", "") < oldest:
                continue
            for alert in self._alerts(game):
                message = evaluate_draw(alert, game, draw)
                if message and self._notify(alert, game, message, f"draw:{draw['id']}", _draw_summary(game, draw)):
                    created += 1
        for game, announce in announces:
            for alert in self._alerts(game):
                message = evaluate_announce(alert, game, announce)
                summary = {"jackpot": announce.get("jackpot")}
                if message and self._notify(alert, game, message, f"jackpot:{game}:{announce.get('date')}", summary):
                    created += 1
        if created:
            log.info("🔔 %d notification(s) créée(s)", created)
        return created
