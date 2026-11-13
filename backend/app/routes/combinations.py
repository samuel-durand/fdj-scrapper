"""/api/combinations : combinaisons sauvegardées par l'utilisateur."""

from __future__ import annotations

import secrets
from collections import defaultdict
from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, request
from pymongo import DESCENDING, ReturnDocument

from ..db import get_db, now
from ..scraper.repository import DrawRepository
from ..security import login_required
from ..serialize import oid
from . import GAME_KEYS, body, fail, int_arg

bp = Blueprint("combinations", __name__, url_prefix="/api/combinations")

# (nb numéros, max numéros, nb complémentaires, max complémentaire)
RULES = {"euromillions": (5, 50, 2, 12), "loto": (5, 49, 1, 10), "eurodreams": (6, 40, 1, 5)}
COMP_FIELD = {"euromillions": "stars", "loto": "luckyNumber", "eurodreams": "dreamNumber"}

# Rangs officiels : (bons numéros, bons complémentaires) -> rang
RANKS = {
    "euromillions": {(5, 2): 1, (5, 1): 2, (5, 0): 3, (4, 2): 4, (4, 1): 5, (3, 2): 6, (4, 0): 7,
                     (2, 2): 8, (3, 1): 9, (3, 0): 10, (1, 2): 11, (2, 1): 12, (2, 0): 13},
    "loto": {(5, 1): 1, (5, 0): 2, (4, 1): 3, (4, 0): 4, (3, 1): 5, (3, 0): 6, (2, 1): 7, (2, 0): 8,
             (1, 1): 9, (0, 1): 9},
    "eurodreams": {(6, 1): 1, (6, 0): 2, (5, 1): 3, (5, 0): 3, (4, 1): 4, (4, 0): 4, (3, 1): 5, (3, 0): 5,
                   (2, 1): 6, (2, 0): 6},
}


def fmt(c: dict) -> dict:
    """Même forme que Combination.format() côté Mongoose."""
    res = {
        "id": str(c["_id"]), "_id": str(c["_id"]), "game": c["game"], "numbers": c.get("numbers", []),
        "name": c.get("name"), "isFavorite": c.get("isFavorite", False), "isPlayed": c.get("isPlayed", False),
        "createdAt": c.get("createdAt"),
    }
    field = COMP_FIELD.get(c["game"])
    if field:
        res[field] = c.get(field)
    if (c.get("result") or {}).get("hasWon"):
        res["result"] = c["result"]
    return res


def _ints(values) -> list[int] | None:
    try:
        return [int(v) for v in values]
    except (TypeError, ValueError):
        return None


def validate(game: str, numbers, comp) -> str | None:
    if game not in RULES:
        return "Jeu invalide"
    count, max_n, comp_count, max_c = RULES[game]
    nums = _ints(numbers or [])
    if nums is None or len(nums) != count or len(set(nums)) != count or not all(1 <= n <= max_n for n in nums):
        return "Numéros invalides pour ce jeu"
    comps = comp if isinstance(comp, list) else ([comp] if comp not in (None, "") else [])
    comps = _ints(comps)
    if comps is None or len(comps) != comp_count or len(set(comps)) != comp_count or \
            not all(1 <= n <= max_c for n in comps):
        return {"euromillions": "Étoiles invalides", "loto": "Numéro chance invalide",
                "eurodreams": "Numéro Dream invalide"}[game]
    return None


def random_combination(game: str) -> dict:
    count, max_n, comp_count, max_c = RULES[game]
    rng = secrets.SystemRandom()
    combo = {"game": game, "numbers": sorted(rng.sample(range(1, max_n + 1), count))}
    comps = sorted(rng.sample(range(1, max_c + 1), comp_count))
    combo[COMP_FIELD[game]] = comps if game == "euromillions" else comps[0]
    return combo


def check(combo: dict, numbers: list[int], comps: list[int], draw: dict | None = None) -> dict:
    game = combo["game"]
    mine = combo.get(COMP_FIELD[game])
    mine = mine if isinstance(mine, list) else ([mine] if mine is not None else [])
    matched_numbers = sorted(set(combo.get("numbers", [])) & set(numbers))
    matched_comps = sorted(set(mine) & set(comps))
    rank = RANKS[game].get((len(matched_numbers), len(matched_comps)))
    result = {
        "hasWon": rank is not None,
        "matchedNumbers": matched_numbers,
        "matchedStars": matched_comps,
        "rank": None if rank is None else ("1 (Jackpot!)" if rank == 1 else str(rank)),
        "prize": None,
    }
    if rank and draw:
        row = next((r for r in draw.get("winningsDistribution", []) if r.get("rank") == rank), None)
        if row:
            result["prize"] = row.get("amount")
    return result


def _own(combination_id):
    _id = oid(combination_id)
    c = get_db().combinations.find_one({"_id": _id}) if _id else None
    if not c:
        return None, fail("Combinaison non trouvée", 404)
    if c["userId"] != g.user["_id"]:
        return None, fail("Non autorisé", 403)
    return c, None


@bp.get("")
@login_required
def list_combinations():
    query = {"userId": g.user["_id"]}
    if request.args.get("game"):
        query["game"] = request.args["game"]
    if request.args.get("favorite") == "true":
        query["isFavorite"] = True
    if request.args.get("played") == "true":
        query["isPlayed"] = True
    limit, skip = int_arg("limit", 50, 1, 200), int_arg("skip", 0)
    db = get_db()
    docs = db.combinations.find(query).sort("createdAt", DESCENDING).skip(skip).limit(limit)
    data = [fmt(c) for c in docs]
    return jsonify(success=True, count=len(data), total=db.combinations.count_documents(query), data=data)


@bp.get("/stats")
@login_required
def stats():
    groups: dict[str, dict] = defaultdict(lambda: {"total": 0, "favorites": 0, "played": 0, "won": 0})
    for c in get_db().combinations.find({"userId": g.user["_id"]}, {"game": 1, "isFavorite": 1, "isPlayed": 1,
                                                                    "result.hasWon": 1}):
        s = groups[c["game"]]
        s["total"] += 1
        s["favorites"] += bool(c.get("isFavorite"))
        s["played"] += bool(c.get("isPlayed"))
        s["won"] += bool((c.get("result") or {}).get("hasWon"))
    return jsonify(success=True, data=[{"_id": game, **s} for game, s in groups.items()])


@bp.post("")
@login_required
def create():
    data = body()
    game = data.get("game")
    if not game or not data.get("numbers"):
        return fail("Jeu et numéros requis")
    comp = data.get(COMP_FIELD.get(game, ""))
    if error := validate(game, data.get("numbers"), comp):
        return fail(error)
    name = (str(data.get("name")).strip()[:100] or None) if data.get("name") else None
    ts = now()
    doc = {"userId": g.user["_id"], "game": game, "numbers": sorted(_ints(data["numbers"])), "name": name,
           "isFavorite": bool(data.get("isFavorite")), "isPlayed": False, "createdAt": ts, "updatedAt": ts}
    doc[COMP_FIELD[game]] = sorted(_ints(comp)) if game == "euromillions" else int(comp)
    doc["_id"] = get_db().combinations.insert_one(doc).inserted_id
    return jsonify(success=True, message="Combinaison sauvegardée", data=fmt(doc)), 201


@bp.post("/generate")
@login_required
def generate():
    data = body()
    game = data.get("game")
    if game not in GAME_KEYS:
        return fail("Jeu requis")
    try:
        count = max(1, min(int(data.get("count", 1)), 10))
    except (TypeError, ValueError):
        count = 1
    combos = [random_combination(game) for _ in range(count)]
    if data.get("save"):
        ts = now()
        docs = [{"userId": g.user["_id"], **c, "isFavorite": False, "isPlayed": False, "createdAt": ts,
                 "updatedAt": ts} for c in combos]
        get_db().combinations.insert_many(docs)
        combos = [fmt(d) for d in docs]
    return jsonify(success=True, count=len(combos), data=combos)


@bp.put("/<combination_id>")
@login_required
def update(combination_id):
    c, error = _own(combination_id)
    if error:
        return error
    data = body()
    updates = {}
    if "name" in data:
        updates["name"] = (str(data["name"]).strip()[:100] or None) if data["name"] else None
    for field in ("isFavorite", "isPlayed"):
        if field in data:
            updates[field] = bool(data[field])
    if "notes" in data:
        updates["notes"] = str(data["notes"] or "")[:500]
    if "playedDate" in data:
        try:
            updates["playedDate"] = datetime.fromisoformat(str(data["playedDate"]).replace("Z", "+00:00"))
        except ValueError:
            return fail("Date invalide")
    updates["updatedAt"] = now()
    c = get_db().combinations.find_one_and_update({"_id": c["_id"]}, {"$set": updates},
                                                  return_document=ReturnDocument.AFTER)
    return jsonify(success=True, message="Combinaison mise à jour", data=fmt(c))


@bp.delete("/<combination_id>")
@login_required
def delete(combination_id):
    c, error = _own(combination_id)
    if error:
        return error
    get_db().combinations.delete_one({"_id": c["_id"]})
    return jsonify(success=True, message="Combinaison supprimée")


@bp.post("/<combination_id>/check")
@login_required
def check_combination(combination_id):
    c, error = _own(combination_id)
    if error:
        return error
    data = body()
    draw = None
    if data.get("drawDate"):  # tirage stocké en base -> on récupère aussi le montant du gain
        draw = DrawRepository(get_db()).get(c["game"], str(data["drawDate"])[:10])
    if draw:
        numbers = draw.get("numbers", [])
        comp = draw.get(COMP_FIELD[c["game"]])
    else:
        numbers = data.get("drawNumbers") or []
        comp = data.get("drawStars") if c["game"] == "euromillions" else (
            data.get("drawLuckyNumber") if c["game"] == "loto" else data.get("drawDreamNumber"))
    comps = comp if isinstance(comp, list) else ([comp] if comp is not None else [])
    result = check(c, _ints(numbers) or [], _ints(comps) or [], draw)
    stored = {**result, "checkedDate": datetime.now(timezone.utc)}
    get_db().combinations.update_one({"_id": c["_id"]}, {"$set": {"result": stored, "updatedAt": now()}})
    c["result"] = stored
    return jsonify(success=True, data={"combination": fmt(c), "result": result})
