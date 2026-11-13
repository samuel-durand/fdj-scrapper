"""Stockage des tirages dans MongoDB.

Collections :
  draws : un document par tirage, `_id` = id du tirage ("em-2026-11-10"), champ `game`
  meta  : document `_id: "draws"` -> { nextDraws: {jeu: annonce}, lastUpdate }
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

from pymongo import DESCENDING
from pymongo.database import Database

META_ID = "draws"
# Champs techniques jamais renvoyés au front
INTERNAL = {"_id": 0, "game": 0, "updatedAt": 0}


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DrawRepository:
    def __init__(self, db: Database):
        self.db = db

    # ------------------------------------------------------------------ lecture
    def list(self, game: str, limit: int | None = None, before: str | None = None) -> list[dict]:
        query: dict[str, Any] = {"game": game}
        if before:
            query["date"] = {"$lt": before}
        cur = self.db.draws.find(query, INTERNAL).sort("date", DESCENDING)
        if limit:
            cur = cur.limit(limit)
        return list(cur)

    def get(self, game: str, date: str) -> dict | None:
        return self.db.draws.find_one({"game": game, "date": date}, INTERNAL)

    def known(self, game: str) -> dict[str, bool]:
        """id -> True si la répartition des gains est connue."""
        cur = self.db.draws.find({"game": game}, {"_id": 1, "winningsDistribution": 1})
        return {d["_id"]: bool(d.get("winningsDistribution")) for d in cur}

    def has_complete(self, game: str, date: str) -> bool:
        return self.db.draws.count_documents(
            {"game": game, "date": date, "winningsDistribution.0": {"$exists": True}}, limit=1
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
