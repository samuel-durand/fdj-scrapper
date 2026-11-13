from datetime import date, datetime, timedelta, timezone

import bcrypt
import jwt

from app.scraper.repository import DrawRepository
from app.services.alerts import AlertProcessor, parse_amount

from .conftest import register

EM_DRAW = {
    "id": "em-2026-11-10", "date": "2026-11-10", "formattedDate": "mardi 10 novembre 2026", "day": "mardi",
    "numbers": [15, 18, 31, 37, 41], "stars": [1, 5], "jackpot": "141 millions €", "jackpotAmount": 141e6,
    "myMillionCode": "SR 154 7343",
    "winningsDistribution": [
        {"rank": 1, "combination": "5 numéros + 2 étoiles", "winners": "0", "amount": "141 899 445 €"},
        {"rank": 4, "combination": "4 numéros + 2 étoiles", "winners": "12", "amount": "1 682,20 €"},
    ],
}
LOTO_DRAW = {"id": "loto-2026-11-11", "date": "2026-11-11", "numbers": [4, 5, 14, 17, 29], "luckyNumber": 8,
             "jackpot": "15 millions €", "winningsDistribution": [{"rank": 1, "combination": "x", "amount": "1 €"}]}


# ------------------------------------------------------------------ auth
def test_register_login_me_refresh_logout(client):
    data = register(client)
    assert data["user"]["email"] == "sam@example.com"
    assert data["user"]["id"] == data["user"]["_id"]
    assert "password" not in data["user"] and "refreshToken" not in data["user"]

    assert client.post("/api/auth/register", json={"name": "X", "email": "sam@example.com",
                                                   "password": "secret123"}).status_code == 400
    assert client.post("/api/auth/login", json={"email": "sam@example.com", "password": "bad"}).status_code == 401

    login = client.post("/api/auth/login", json={"email": "SAM@example.com", "password": "secret123"}).get_json()
    headers = {"Authorization": f"Bearer {login['data']['token']}"}
    me = client.get("/api/auth/me", headers=headers).get_json()
    assert me["data"]["user"]["name"] == "Sam" and me["data"]["user"]["lastLogin"].endswith("Z")

    refreshed = client.post("/api/auth/refresh", json={"refreshToken": login["data"]["refreshToken"]})
    assert refreshed.status_code == 200 and refreshed.get_json()["data"]["token"]

    assert client.post("/api/auth/logout", headers=headers).status_code == 200
    assert client.post("/api/auth/refresh", json={"refreshToken": login["data"]["refreshToken"]}).status_code == 401


def test_auth_errors(client, app):
    assert client.get("/api/auth/me").get_json()["message"] == "Non autorisé - Token manquant"
    expired = jwt.encode({"id": "x", "exp": datetime.now(timezone.utc) - timedelta(seconds=5)},
                         app.config["APP"].jwt_secret, algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert res.status_code == 401 and res.get_json()["code"] == "TOKEN_EXPIRED"


def test_legacy_bcryptjs_password_still_works(client, db):
    """Les comptes créés par l'ancien backend (bcryptjs, préfixe $2a$) restent valides."""
    legacy_hash = bcrypt.hashpw(b"ancienMdp", bcrypt.gensalt(12, prefix=b"2a")).decode()
    assert legacy_hash.startswith("$2a$12$")
    db.users.insert_one({"name": "Legacy", "email": "old@example.com", "password": legacy_hash,
                         "role": "user", "isActive": True, "__v": 0})
    res = client.post("/api/auth/login", json={"email": "old@example.com", "password": "ancienMdp"})
    assert res.status_code == 200 and "__v" not in res.get_json()["data"]["user"]


def test_disabled_account(client, db, user):
    db.users.update_one({"email": "sam@example.com"}, {"$set": {"isActive": False}})
    assert client.get("/api/auth/me", headers=user["headers"]).get_json()["message"] == "Compte désactivé"


# ------------------------------------------------------------------ users
def test_preferences_profile_password(client, user):
    h = user["headers"]
    res = client.put("/api/users/preferences", json={"theme": "dark", "defaultTab": "loto"}, headers=h).get_json()
    assert res["data"]["user"]["preferences"]["theme"] == "dark"
    assert res["data"]["user"]["preferences"]["defaultTab"] == "loto"
    assert client.put("/api/users/preferences", json={"theme": "pink"}, headers=h).status_code == 400

    res = client.put("/api/users/profile", json={"name": "Samuel"}, headers=h).get_json()
    assert res["data"]["user"]["name"] == "Samuel"

    assert client.put("/api/users/password", json={"currentPassword": "nope", "newPassword": "abcdef"},
                      headers=h).status_code == 401
    assert client.put("/api/users/password", json={"currentPassword": "secret123", "newPassword": "nouveau1"},
                      headers=h).status_code == 200
    assert client.post("/api/auth/login", json={"email": "sam@example.com", "password": "nouveau1"}).status_code == 200


# ------------------------------------------------------------------ alerts / notifications
def test_alerts_crud_and_ownership(client, user):
    h = user["headers"]
    res = client.post("/api/alerts", json={"name": "Gros jackpot", "type": "jackpot_threshold", "game": "euromillions",
                                           "config": {"threshold": 100000000}}, headers=h)
    assert res.status_code == 201
    alert = res.get_json()["data"]
    assert alert["enabled"] is True and alert["config"]["threshold"] == 100000000

    assert client.get("/api/alerts", headers=h).get_json()["count"] == 1
    res = client.put(f"/api/alerts/{alert['_id']}", json={"name": "Renommée", "userId": "pirate"}, headers=h)
    assert res.get_json()["data"]["name"] == "Renommée"
    assert res.get_json()["data"]["userId"] == user["user"]["_id"]  # userId non modifiable
    assert client.patch(f"/api/alerts/{alert['_id']}/toggle", headers=h).get_json()["data"]["enabled"] is False

    other = register(client, "Autre", "autre@example.com")
    oh = {"Authorization": f"Bearer {other['token']}"}
    assert client.delete(f"/api/alerts/{alert['_id']}", headers=oh).status_code == 403
    assert client.delete("/api/alerts/pasunid", headers=h).status_code == 404
    assert client.delete(f"/api/alerts/{alert['_id']}", headers=h).status_code == 200


def test_notifications(client, user):
    h = user["headers"]
    created = client.post("/api/notifications", json={"message": "Coucou", "gameType": "loto",
                                                      "draw": {"date": "2026-11-11T00:00:00.000Z"}}, headers=h)
    assert created.status_code == 201
    client.post("/api/notifications", json={"message": "Deux", "gameType": "loto"}, headers=h)
    listing = client.get("/api/notifications", headers=h).get_json()
    assert listing["count"] == 2 and listing["unreadCount"] == 2
    nid = listing["data"][0]["_id"]
    assert client.patch(f"/api/notifications/{nid}/read", headers=h).get_json()["data"]["read"] is True
    assert client.get("/api/notifications/unread-count", headers=h).get_json()["count"] == 1
    assert client.patch("/api/notifications/mark-all-read", headers=h).get_json()["count"] == 1
    assert client.delete("/api/notifications", headers=h).get_json()["count"] == 2


def test_alert_processor_creates_notifications_once(client, db, user):
    h = user["headers"]
    for payload in (
        {"name": "Tirage", "type": "new_draw", "game": "euromillions"},
        {"name": "Favoris", "type": "favorite_numbers", "game": "euromillions",
         "config": {"numbers": [15, 18, 2, 3, 4], "minMatches": 2}},
        {"name": "Étoile", "type": "lucky_number_match", "game": "euromillions", "config": {"luckyNumber": 5}},
        {"name": "Jackpot", "type": "jackpot_threshold", "game": "euromillions", "config": {"threshold": 15000000}},
        {"name": "Loto", "type": "new_draw", "game": "loto"},
    ):
        assert client.post("/api/alerts", json=payload, headers=h).status_code == 201

    announce = {"date": "2026-11-13", "formattedDate": "vendredi 13 novembre 2026", "jackpot": "17 millions €",
                "prefix": "Minimum"}
    today = date(2026, 11, 11)
    processor = AlertProcessor(db)
    assert processor.process([("euromillions", EM_DRAW)], [("euromillions", announce)], today=today) == 4
    # relancer ne crée pas de doublons
    assert AlertProcessor(db).process([("euromillions", EM_DRAW)], [("euromillions", announce)], today=today) == 0
    # un vieux tirage (rattrapage d'historique) ne notifie pas
    old = {**LOTO_DRAW, "id": "loto-2026-09-01", "date": "2026-09-01"}
    assert AlertProcessor(db).process([("loto", old)], today=today) == 0

    notes = client.get("/api/notifications", headers=h).get_json()
    messages = " | ".join(n["message"] for n in notes["data"])
    assert notes["unreadCount"] == 4
    assert "15 - 18 - 31 - 37 - 41 + 1 / 5" in messages
    assert "2 de vos numéros favoris" in messages and "étoile 5" in messages and "17 millions €" in messages
    assert all("dedupKey" not in n for n in notes["data"])

    # notifications désactivées dans les préférences -> rien
    client.put("/api/users/preferences", json={"notifications": False}, headers=h)
    assert AlertProcessor(db).process([("loto", LOTO_DRAW)], today=today) == 0


def test_parse_amount():
    assert parse_amount("17 millions €") == 17e6
    assert parse_amount("1,5 million €") == 1.5e6
    assert parse_amount("50 000 € par mois pendant 30 ans") == 50000
    assert parse_amount(100000000) == 1e8


# ------------------------------------------------------------------ combinations
def test_combinations(client, db, user):
    h = user["headers"]
    assert client.post("/api/combinations", json={"game": "euromillions", "numbers": [1, 2, 3, 4, 60],
                                                  "stars": [1, 2]}, headers=h).status_code == 400
    assert client.post("/api/combinations", json={"game": "loto", "numbers": [1, 2, 3, 4, 5],
                                                  "luckyNumber": 11}, headers=h).status_code == 400
    res = client.post("/api/combinations", json={"game": "euromillions", "numbers": [41, 15, 18, 37, 2],
                                                 "stars": [5, 1], "name": "Ma grille"}, headers=h)
    assert res.status_code == 201
    combo = res.get_json()["data"]
    assert combo["numbers"] == [2, 15, 18, 37, 41] and combo["stars"] == [1, 5]

    gen = client.post("/api/combinations/generate", json={"game": "eurodreams", "count": 3, "save": True},
                      headers=h).get_json()
    assert gen["count"] == 3 and all(len(c["numbers"]) == 6 and 1 <= c["dreamNumber"] <= 5 for c in gen["data"])

    listing = client.get("/api/combinations?game=euromillions", headers=h).get_json()
    assert listing["total"] == 1

    # Vérification avec le tirage stocké en base : 4 numéros + 2 étoiles = rang 4 + montant
    DrawRepository(db).upsert("euromillions", [EM_DRAW])
    check = client.post(f"/api/combinations/{combo['id']}/check", json={"drawDate": "2026-11-10"},
                        headers=h).get_json()["data"]["result"]
    assert check == {"hasWon": True, "matchedNumbers": [15, 18, 37, 41], "matchedStars": [1, 5], "rank": "4",
                     "prize": "1 682,20 €"}

    # Ancien format de requête (numéros envoyés par le front)
    check = client.post(f"/api/combinations/{combo['id']}/check",
                        json={"drawNumbers": [2, 15, 18, 37, 41], "drawStars": [1, 5]}, headers=h).get_json()
    assert check["data"]["result"]["rank"] == "1 (Jackpot!)"

    stats = client.get("/api/combinations/stats", headers=h).get_json()["data"]
    assert {s["_id"]: s["total"] for s in stats} == {"euromillions": 1, "eurodreams": 3}

    upd = client.put(f"/api/combinations/{combo['id']}", json={"isFavorite": True}, headers=h).get_json()
    assert upd["data"]["isFavorite"] is True
    assert client.delete(f"/api/combinations/{combo['id']}", headers=h).status_code == 200


# ------------------------------------------------------------------ admin
def test_admin(client, db, user, admin):
    assert client.get("/api/admin/stats", headers=user["headers"]).status_code == 403
    client.post("/api/combinations/generate", json={"game": "loto", "count": 2, "save": True}, headers=user["headers"])
    client.post("/api/alerts", json={"name": "A", "type": "new_draw", "game": "loto"}, headers=user["headers"])

    stats = client.get("/api/admin/stats", headers=admin["headers"]).get_json()["data"]
    assert stats["users"]["total"] == 2 and stats["combinations"]["total"] == 2
    assert stats["alerts"] == {"total": 1, "active": 1, "inactive": 0}
    assert len(stats["timeSeries"]["daily"]) == 30 and stats["timeSeries"]["daily"][-1]["users"] == 2

    users = client.get("/api/admin/users?search=sam", headers=admin["headers"]).get_json()
    assert users["pagination"]["total"] == 1 and users["data"][0]["stats"] == {"combinations": 2, "alerts": 1}

    combos = client.get("/api/admin/combinations", headers=admin["headers"]).get_json()["data"]
    assert combos[0]["userId"]["email"] == "sam@example.com"

    me = admin["user"]["_id"]
    assert client.put(f"/api/admin/users/{me}", json={"role": "user"}, headers=admin["headers"]).status_code == 403
    assert client.delete(f"/api/admin/users/{me}", headers=admin["headers"]).status_code == 403
    sam = user["user"]["_id"]
    assert client.delete(f"/api/admin/users/{sam}", headers=admin["headers"]).status_code == 200
    assert db.combinations.count_documents({}) == 0 and db.alerts.count_documents({}) == 0


# ------------------------------------------------------------------ draws
def test_draws_endpoints_and_etag(client, db):
    repo = DrawRepository(db)
    added, _ = repo.upsert("euromillions", [EM_DRAW])
    assert len(added) == 1 and repo.upsert("euromillions", [EM_DRAW]) == ([], 0)
    repo.upsert("loto", [LOTO_DRAW])
    repo.set_next_draw("loto", {"date": "2026-11-13", "jackpot": "21 millions €"})
    repo.touch()

    res = client.get("/api/draws")
    body = res.get_json()
    assert body["euromillions"][0] == EM_DRAW  # aucun champ technique (_id, game…) exposé
    assert body["nextDraws"]["loto"]["jackpot"] == "21 millions €" and body["eurodreams"] == []
    assert body["lastUpdate"].endswith("Z")
    assert res.headers["Cache-Control"] == "public, max-age=60"
    assert client.get("/api/draws", headers={"If-None-Match": res.headers["ETag"]}).status_code == 304

    one = client.get("/api/draws/loto").get_json()
    assert one["data"][0]["luckyNumber"] == 8 and one["nextDraw"]["jackpot"] == "21 millions €"
    assert client.get("/api/draws/euromillions/2026-11-10").get_json()["data"]["myMillionCode"] == "SR 154 7343"
    assert client.get("/api/draws/euromillions/2026-01-01").status_code == 404
    assert client.get("/api/draws/keno").status_code == 404
    assert client.get("/api/inconnue").get_json() == {"success": False, "message": "Route API non trouvée"}


def test_health(client):
    assert client.get("/api/health").get_json()["status"] == "OK"
