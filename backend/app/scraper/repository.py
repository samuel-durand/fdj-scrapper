"""Stockage des tirages dans MongoDB.

Collections :
  draws : un document par tirage, `_id` = id du tirage ("em-2026-11-10",
          "amigo-2026-11-13-1935" pour les jeux à plusieurs tirages par jour), champ `game`
  meta  : document `_id: "draws"` -> { nextDraws: {jeu: annonce}, lastUpdate }
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

from pymongo import DESCENDING
from pymongo.database import Database

META_ID = "draws"
# Champs techniques jamais renvoyés au front
INTERNAL = {"_id": 0, "game": 0, "updatedAt": 0, "source": 0}


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DrawRepository:
    def __init__(self, db: Database):
        self.db = db

    # ------------------------------------------------------------------ lecture
    # Plusieurs tirages par jour (Crescendo, Amigo) : on trie aussi sur l'heure.
    ORDER = [("date", DESCENDING), ("drawTime", DESCENDING)]

    def list(self, game: str, limit: int | None = None, before: str | None = None,
             fields: tuple[str, ...] | None = None) -> list[dict]:
        """Tirages du plus récent au plus ancien.

        before : "AAAA-MM-JJ" (jours précédents) ou heure ISO d'un tirage (tirages antérieurs).
        fields : ne renvoyer que ces champs."""
        query: dict[str, Any] = {"game": game}
        if before and len(before) > 10:
            day = before[:10]
            query["$or"] = [{"date": {"$lt": day}}, {"date": day, "drawTime": {"$lt": before}}]
        elif before:
            query["date"] = {"$lt": before}
        projection = {"_id": 0, **{f: 1 for f in fields}} if fields else INTERNAL
        cur = self.db.draws.find(query, projection).sort(self.ORDER)
        if limit:
            cur = cur.limit(limit)
        return list(cur)

    def get(self, game: str, date: str) -> dict | None:
        """Tirage d'une date (le dernier de la journée pour les jeux à plusieurs tirages)."""
        return next(iter(self.db.draws.find({"game": game, "date": date}, INTERNAL).sort(self.ORDER).limit(1)), None)

    def known(self, game: str) -> dict[str, bool]:
        """id -> True si la répartition (ou le barème) des gains est connue."""
        cur = self.db.draws.find({"game": game}, {"_id": 1, "winningsDistribution": 1, "payouts": 1})
        return {d["_id"]: bool(d.get("winningsDistribution") or d.get("payouts")) for d in cur}

    def last_draw_times(self, game: str) -> dict[str, str]:
        """Journée -> heure (ISO) du dernier tirage enregistré."""
        out: dict[str, str] = {}
        for d in self.db.draws.find({"game": game}, {"_id": 0, "date": 1, "drawTime": 1}):
            if d.get("drawTime") and d["drawTime"] > out.get(d["date"], ""):
                out[d["date"]] = d["drawTime"]
        return out

    def is_complete(self, draw_id: str) -> bool:
        return self.db.draws.count_documents(
            {"_id": draw_id, "$or": [{"winningsDistribution.0": {"$exists": True}}, {"payouts": {"$ne": None}}]},
            limit=1,
        ) > 0

    def has_complete(self, game: str, date: str) -> bool:
        return self.db.draws.count_documents(
            {"game": game, "date": date,
             "$or": [{"winningsDistribution.0": {"$exists": True}}, {"payouts": {"$ne": None}}]}, limit=1
        ) > 0

    def meta(self) -> dict:
        return self.db.meta.find_one({"_id": META_ID}) or {}

    def next_draws(self) -> dict:
        return self.meta().get("nextDraws", {})

    # ------------------------------------------------------------------ écriture
    def upsert(self, game: str, draws: Iterable[dict]) -> tuple[list[dict], int]:
        """Insère / met à jour. Retourne (tirages ajoutés, nombre de mis à jour)."""
        added, updated = [], 0
        for draw in draws:
            existing = self.db.draws.find_one({"_id": draw["id"]}, INTERNAL)
            if existing == draw:
                continue
            doc = {**draw, "_id": draw["id"], "game": game, "updatedAt": _now()}
            self.db.draws.replace_one({"_id": draw["id"]}, doc, upsert=True)
            if existing is None:
                added.append(draw)
            else:
                updated += 1
        return added, updated

    def set_next_draw(self, game: str, announce: dict) -> bool:
        """Enregistre le prochain tirage annoncé. Retourne True s'il a changé."""
        if self.next_draws().get(game) == announce:
            return False
        self.db.meta.update_one({"_id": META_ID}, {"$set": {f"nextDraws.{game}": announce}}, upsert=True)
        return True

    def touch(self) -> None:
        self.db.meta.update_one({"_id": META_ID}, {"$set": {"lastUpdate": _now()}}, upsert=True)
