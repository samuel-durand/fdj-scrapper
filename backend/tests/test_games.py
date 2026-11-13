"""Keno, Crescendo, Amigo : normalisation des données FDJ, tirages multiples par jour, API."""

from datetime import datetime

from app.scraper.games import GAMES, PARIS, draw_id, parse_announce
from app.scraper.repository import DrawRepository
from app.scraper.scraper import Scraper

# Extraits réels (abrégés) des pages fdj.fr
KENO_RAW = {
    "date": "2026-11-12T20:35:00.000+01:00", "externalId": "26406", "intraDayDrawNumber": "$undefined",
    "numbers": ["10", "11", "12", "15", "19", "28", "32", "34", "37", "39", "40", "49", "50", "52", "56", "8"],
    "options": {"multiplier": "2", "joker": "4630089"},
    "shares": [
        {"numbersDrawn": 4, "winningBoards": [
            {"betAmounts": {"1": {"amount": "8 €"}, "10": {"amount": "80 €"}}, "numbersPlayed": 4},
        ]},
        {"numbersDrawn": 10, "winningBoards": [
            {"betAmounts": {"1": {"amount": "200 000 €", "pensionAmount": "10 000 €", "pensionPeriod": "year"},
                            "10": {"amount": "2 000 000 €", "pensionAmount": "100 000 €", "pensionPeriod": "year"}},
             "numbersPlayed": 10},
            {"betAmounts": {"1": {"amount": "2 €"}, "10": {"amount": "20 €"}}, "numbersPlayed": 0},
        ]},
    ],
}

CRESCENDO_RAW = {
    "date": "2026-11-07T19:00:01.000+01:00", "externalId": "26315", "intraDayDrawNumber": "07",
    "numbers": ["10", "11", "12", "17", "19", "2", "21", "25", "4", "7"], "complementariesNumbers": ["E"],
    "jackpotAmount": 70000000,
    "shares": [
        {"divisionId": 2, "divisionName": "9 / 10 + L", "winners": 7, "winningAmount": 1000},
        {"divisionId": 1, "divisionName": "10 / 10", "winners": 1, "winningAmount": 700000},
        {"divisionId": 10, "divisionName": "Lettre", "winners": 136590, "winningAmount": 1},
    ],
}


def amigo_raw(hhmm: str, n: str) -> dict:
    return {
        "date": f"2026-11-13T{hhmm[:2]}:{hhmm[2:]}:00.000+01:00", "externalId": f"2026317{n}", "intraDayDrawNumber": n,
        "numbers": ["11", "16", "17", "19", "20", "21", "6"], "complementariesNumbers": ["23", "12", "18", "4", "1"],
        "shares": [
            {"numbersDrawn": "3", "board": [{"blueNumbers": 3, "yellowNumbers": 0, "winnings": ["2 €", "4 €", "6 €", "8 €"]}]},
            {"numbersDrawn": "7", "board": [
                {"blueNumbers": 7, "yellowNumbers": 0, "winnings": ["25 000 €", "50 000 €", "75 000 €", "100 000 €"]},
                {"blueNumbers": 6, "yellowNumbers": 1, "winnings": ["500 €", "1 000 €", "1 500 €", "2 000 €"]},
            ]},
        ],
    }


def test_keno():
    g = GAMES["keno"]
    d = g.parse(KENO_RAW)
    assert d["id"] == "keno-2026-11-12" and "time" not in d  # un seul tirage par jour : id inchangé
    assert d["numbers"][0] == 8 and len(d["numbers"]) == 16
    assert d["multiplier"] == 2 and d["jokerPlus"] == "4 630 089"
    p = d["payouts"]
    assert p["stakes"] == ["1 €", "10 €"]                       # tri numérique (pas "1", "10" alphabétique)
    assert [x["label"] for x in p["grids"]] == ["10 numéros joués", "4 numéros joués"]
    top = p["grids"][0]["rows"][0]
    assert top["combination"] == "10 bons numéros"
    assert top["amounts"][0] == "200 000 € ou 10 000 € par an à vie"
    assert p["grids"][0]["rows"][1]["combination"] == "0 bon numéro"
    assert p["grids"][1]["rows"][0]["amounts"] == ["8 €", "80 €"]  # espace fine insécable nettoyée
    assert g.is_complete(d)


def test_crescendo():
    g = GAMES["crescendo"]
    d = g.parse(CRESCENDO_RAW)
    assert d["id"] == "cr-2026-11-07-1900" and d["time"] == "19:00" and d["intradayNumber"] == 7
    assert d["numbers"] == [2, 4, 7, 10, 11, 12, 17, 19, 21, 25] and d["letter"] == "E"
    assert d["jackpot"] == "700 000 €"
    rows = d["winningsDistribution"]
    assert [r["rank"] for r in rows] == [1, 2, 10]
    assert [r["combination"] for r in rows] == ["10 bons numéros", "9 bons numéros + lettre", "Lettre seule"]
    assert rows[0]["winners"] == "1" and rows[0]["amount"] == "700 000 €" and rows[2]["winners"] == "136 590"


def test_amigo():
    d = GAMES["amigo"].parse(amigo_raw("1935", "198"))
    assert d["id"] == "amigo-2026-11-13-1935" and d["time"] == "19:35"
    assert d["numbers"] == [6, 11, 16, 17, 19, 20, 21] and d["yellowNumbers"] == [1, 4, 12, 18, 23]
    p = d["payouts"]
    assert p["stakes"] == ["Mise ×1", "Mise ×2", "Mise ×3", "Mise ×4"]
    assert [x["label"] for x in p["grids"]] == ["7 bons numéros", "3 bons numéros"]
    assert [r["combination"] for r in p["grids"][0]["rows"]] == ["7 bleus", "6 bleus + 1 jaune"]


def test_intraday_ids_and_announce():
    dt = datetime(2026, 11, 14, 13, 0, tzinfo=PARIS)
    assert draw_id(GAMES["crescendo"], dt) == "cr-2026-11-14-1300"
    assert draw_id(GAMES["loto"], dt) == "loto-2026-11-14"
    ann = [{"date": "2026-11-14T13:00:01.000+01:00", "amount": "100 000 €", "prefix": "Jackpot de minimum",
            "suffix1": "à gagner chaque heure entre 13h et 19h", "wageringEndsAt": "$undefined"}]
    a = parse_announce(GAMES["crescendo"], ann)
    assert a["time"] == "13:00" and a["suffix"] == "à gagner chaque heure entre 13h et 19h"
    # Jeux à un tirage par jour : pas de champ "time" (l'annonce stockée ne change pas de forme)
    assert "time" not in parse_announce(GAMES["loto"], ann)


def test_repository_multiple_draws_per_day(db):
    repo = DrawRepository(db)
    g = GAMES["amigo"]
    draws = [g.parse(amigo_raw(t, n)) for t, n in (("1925", "196"), ("1935", "198"), ("1930", "197"))]
    added, _ = repo.upsert("amigo", draws)
    assert len(added) == 3
    assert [d["time"] for d in repo.list("amigo")] == ["19:35", "19:30", "19:25"]
    assert repo.get("amigo", "2026-11-13")["time"] == "19:35"
    assert repo.is_complete("amigo-2026-11-13-1935") and not repo.is_complete("amigo-2026-11-13-1940")
    assert repo.last_draw_times("amigo") == {"2026-11-13": "2026-11-13T19:35:00+01:00"}


def test_missing_dates_intraday(db):
    repo = DrawRepository(db)
    g = GAMES["crescendo"]
    repo.upsert("crescendo", [g.parse(CRESCENDO_RAW)])  # 07/11 19:00 = dernier tirage du jour
    s = Scraper(repo)
    sat7 = datetime(2026, 11, 7, 19, 0, tzinfo=PARIS)
    oct31 = datetime(2026, 10, 31, 19, 0, tzinfo=PARIS)
    # 07/11 complet, 31/10 absent -> seul le 31/10 est à télécharger
    assert s._missing_dates(g, {sat7.date(): sat7, oct31.date(): oct31}, [], False) == [oct31.date()]
    # La FDJ annonce un tirage plus tardif le 07/11 que celui en base -> journée à compléter
    later = datetime(2026, 11, 7, 20, 0, tzinfo=PARIS)
    assert s._missing_dates(g, {later.date(): later}, [], False) == [later.date()]


def test_draws_api_new_games(client, db):
    repo = DrawRepository(db)
    g = GAMES["amigo"]
    repo.upsert("amigo", [g.parse(amigo_raw("1930", "197")), g.parse(amigo_raw("1935", "198"))])
    repo.upsert("keno", [GAMES["keno"].parse(KENO_RAW)])
    body = client.get("/api/draws").get_json()
    amigo = body["amigo"]
    # Barème identique d'un tirage à l'autre : seulement sur le plus récent
    assert amigo[0]["time"] == "19:35" and "payouts" in amigo[0] and "payouts" not in amigo[1]
    assert body["keno"][0]["multiplier"] == 2 and body["crescendo"] == []
    assert client.get("/api/draws/amigo/2026-11-13").get_json()["data"]["time"] == "19:35"


def test_amigo_shares_reference_reused():
    """La FDJ remplace le barème des tirages suivants par une référence ("$…") : on recopie le premier."""
    from app.scraper.client import Page

    full = amigo_raw("1935", "198")
    ref = {**amigo_raw("1930", "197"), "shares": "$12:props:shares"}
    page = Page(url="", final_url="")
    page.queries[("drawGameResultByDate", '{"date":"13/11/2026","gameName":"amigo"}')] = [full, ref]
    draws = {d["id"]: d for d in Scraper._page_draws(page, GAMES["amigo"])}
    assert draws["amigo-2026-11-13-1930"]["payouts"] == draws["amigo-2026-11-13-1935"]["payouts"]
    assert GAMES["amigo"].parse(ref)["payouts"] is None


def test_json_gzip(client, db):
    import gzip
    import json

    g = GAMES["crescendo"]
    hours = [{**CRESCENDO_RAW, "date": f"2026-11-07T{h}:00:01.000+01:00"} for h in range(13, 20)]
    DrawRepository(db).upsert("crescendo", [g.parse(r) for r in hours])  # > 1 Ko : compressé
    res = client.get("/api/draws/crescendo", headers={"Accept-Encoding": "gzip, deflate"})
    assert res.status_code == 200 and res.headers["Content-Encoding"] == "gzip"
    assert "Accept-Encoding" in res.headers["Vary"]
    assert json.loads(gzip.decompress(res.data))["data"][0]["letter"] == "E"
    plain = client.get("/api/draws/crescendo")
    assert "Content-Encoding" not in plain.headers and plain.get_json()["data"][0]["letter"] == "E"
