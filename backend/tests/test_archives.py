"""Import de l'historique officiel FDJ (archives CSV) : lecture, règles du jeu, corrections, API."""

import io
import zipfile

from app.scraper import archives
from app.scraper.games import GAMES
from app.scraper.repository import DrawRepository

# Extraits réels (abrégés) des archives fdj.fr
LOTO_2026 = (
    "annee_numero_de_tirage;jour_de_tirage;date_de_tirage;date_de_forclusion;boule_1;boule_2;boule_3;boule_4;"
    "boule_5;numero_chance;combinaison_gagnante_en_ordre_croissant;"
    + "".join(f"nombre_de_gagnant_au_rang{i};rapport_du_rang{i};" for i in range(1, 10))
    + "nombre_de_codes_gagnants;rapport_codes_gagnants;codes_gagnants;boule_1_second_tirage;boule_2_second_tirage;"
    "boule_3_second_tirage;boule_4_second_tirage;boule_5_second_tirage;promotion_second_tirage;"
    "combinaison_gagnant_second_tirage_en_ordre_croissant;"
    + "".join(f"nombre_de_gagnant_au_rang_{i}_second_tirage;rapport_du_rang{i}_second_tirage;" for i in range(1, 5))
    + "numero_7;devise;\n"
    "26135;MERCREDI;11/11/2026;10/02/2027;5;14;17;29;4;8;4-5-14-17-29+8;0;15000000,00;4;47600,90;72;645,40;675;"
    "248,30;2926;34,20;25132;14,30;33108;8,40;296993;3,70;365813;2,20;10;20000,00;L 4927 1805, S 9923 5938;"
    "18;30;34;35;44;;18-30-34-35-44;1;133947,00;152;1033,10;8636;46,70;139908;3,00;5195900;eur;\n"
)
LOTO_2017 = (
    "annee_numero_de_tirage;jour_de_tirage;date_de_tirage;date_de_forclusion;boule_1;boule_2;boule_3;boule_4;"
    "boule_5;numero_chance;combinaison_gagnante_en_ordre_croissant;"
    + "".join(f"nombre_de_gagnant_au_rang{i};rapport_du_rang{i};" for i in range(1, 7))
    + "numero_jokerplus;devise;\n"
    "2017027;SAMEDI  ;04/03/2017;04/05/2017;28;14;37;32;4;4;4-14-28-32-37+4;0;0;1;327742,5;617;1143,2;26910;"
    "11,3;394534;5,5;585454;2;6 036 389;eur;\n"
)
LOTO_1976 = (  # 6 numéros sur 49 : règles différentes, ignoré
    "annee_numero_de_tirage;1er_ou_2eme_tirage;jour_de_tirage;date_de_tirage;date_de_forclusion;boule_1;boule_2;"
    "boule_3;boule_4;boule_5;boule_6;boule_complementaire\n"
    "2008080;2;SA;20081004;20081204;33;32;42;16;15;49;37\n"
)
EM_2004 = (  # ancien format : dates AAAAMMJJ, rangs sans suffixe « Euro_Millions »
    "annee_numero_de_tirage;jour_de_tirage;date_de_tirage;date_de_forclusion;boule_1;boule_2;boule_3;boule_4;"
    "boule_5;etoile_1;etoile_2;boules_gagnantes_en_ordre_croissant;etoiles_gagnantes_en_ordre_croissant;"
    + "".join(f"nombre_de_gagnant_au_rang{i}_en_france;nombre_de_gagnant_au_rang{i}_en_europe;rapport_du_rang{i};"
              for i in range(1, 13))
    + "\n2004001;VE;20040213;20040413;16;29;32;36;41;7;9;-16-29-32-36-41-;-7-9-;"
    + "0;0;0;" * 11 + "1;2;3,5\n"
)
EM_2016 = (  # une ligne datée sur deux chiffres
    "annee_numero_de_tirage;jour_de_tirage;date_de_tirage;date_de_forclusion;boule_1;boule_2;boule_3;boule_4;"
    "boule_5;etoile_1;etoile_2\n2016077;VE;23/09/16;23/11/2016;42;14;39;16;49;9;3\n"
)
KENO_2020 = "annee_numero_de_tirage;date_de_tirage;" + ";".join(f"boule{i}" for i in range(1, 21)) + "\n25612;02/11/2025;" + ";".join(str(i) for i in range(1, 21)) + "\n"
CRESCENDO = (
    "annee_numero_de_tirage;date_de_tirage;heure_de_tirage;date_de_forclusion;"
    + ";".join(f"boule{i}" for i in range(1, 11))
    + ";lettre;combinaison_gagnante_en_ordre_croissant;"
    + "".join(f"nombre_de_gagnant_au_rang{i};rapport_du_rang{i};" for i in range(1, 11))
    + "devise;\n26315;07/11/2026;19:00:00;06/02/2027;4;2;17;19;12;11;7;10;25;21;E;x;1;700000,00;7;1000,00;"
    + "42;500,00;" * 7 + "136590;1,00;eur;\n"
)


def rows(text):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("a.csv", text.encode("utf-8"))
    return archives.read_csv(buf.getvalue())[0][1]


def test_loto_current_format():
    (d,) = archives.parse_archive(GAMES["loto"], "loto_201911", rows(LOTO_2026))
    assert d["id"] == "loto-2026-11-11" and d["numbers"] == [4, 5, 14, 17, 29] and d["luckyNumber"] == 8
    dist = d["winningsDistribution"]
    assert len(dist) == 9 and dist[0]["combination"] == "5 numéros + numéro chance"
    assert dist[1] == {"rank": 2, "combination": "5 numéros", "winners": "4", "amount": "47 600,90 €"}
    assert dist[8]["winners"] == "365 813"
    assert d["secondDraw"] == [18, 30, 34, 35, 44]
    assert [r["combination"] for r in d["secondDrawDistribution"]] == ["5 numéros", "4 numéros", "3 numéros", "2 numéros"]
    assert d["secondDrawDistribution"][0]["winners"] == "1"
    assert d["codesGagnants"] == ["L 4927 1805", "S 9923 5938"] and d["jokerPlus"] == "5 195 900"
    assert d["jackpot"] == "15 millions €" and d["lotoType"] == "loto"


def test_loto_2008_six_ranks_and_super_loto():
    (d,) = archives.parse_archive(GAMES["loto"], "nouveau_superloto", rows(LOTO_2017))
    assert d["date"] == "2017-03-04" and d["lotoType"] == "superloto"
    assert [r["combination"] for r in d["winningsDistribution"]][-1] == "0 ou 1 numéro + numéro chance"
    assert d["winningsDistribution"][0]["amount"] == "Non disponible"  # pas de gagnant, rapport 0
    assert d["jokerPlus"] == "6 036 389"


def test_incompatible_rules_are_skipped():
    assert archives.parse_archive(GAMES["loto"], "loto", rows(LOTO_1976)) is None
    assert archives.parse_archive(GAMES["keno"], "keno_202010", rows(KENO_2020)) is None


def test_euromillions_old_formats():
    (d,) = archives.parse_archive(GAMES["euromillions"], "euromillions", rows(EM_2004))
    assert d["id"] == "em-2004-02-13" and d["stars"] == [7, 9]
    assert len(d["winningsDistribution"]) == 12
    assert d["winningsDistribution"][0]["combination"] == "Rang 1"  # ordre des rangs de 2004 non documenté
    assert d["winningsDistribution"][11] == {"rank": 12, "combination": "Rang 12", "winners": "1",
                                             "winnersEurope": "2", "amount": "3,50 €"}
    (d,) = archives.parse_archive(GAMES["euromillions"], "euromillions_4", rows(EM_2016))
    assert d["date"] == "2016-09-23"                                 # JJ/MM/AA


def test_crescendo_intraday():
    (d,) = archives.parse_archive(GAMES["crescendo"], "crescendo_202511", rows(CRESCENDO))
    assert d["id"] == "cr-2026-11-07-1900" and d["time"] == "19:00" and d["letter"] == "E"
    assert d["winningsDistribution"][0] == {"rank": 1, "combination": "10 bons numéros", "winners": "1",
                                            "amount": "700 000 €"}
    assert d["winningsDistribution"][9]["combination"] == "Lettre seule"


class FakeHttp:
    """fdj.fr simulé : page historique + archives ZIP."""

    def __init__(self, files):
        self.files = files

    def get(self, url):
        if url.endswith("/historique"):
            links = "".join(f'<a class="block" download="{n}" title="Historique {n}" href="https://x/{n}">' for n in self.files)
            return type("R", (), {"status_code": 200, "text": links, "raise_for_status": lambda s: None})()
        name = url.rsplit("/", 1)[1]
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr(f"{name}.csv", self.files[name].encode("utf-8"))
        return type("R", (), {"status_code": 200, "content": buf.getvalue()})()


def test_import_adds_fixes_and_keeps(db):
    repo = DrawRepository(db)
    good = archives.parse_archive(GAMES["loto"], "loto_201911", rows(LOTO_2026))[0]
    repo.upsert("loto", [{**good, "id": "loto-2026-11-11", "extra": "scrapé"}])         # identique : conservé
    repo.upsert("loto", [{**good, "id": "loto-2017-03-04", "date": "2017-03-04",
                          "numbers": [1, 2, 3, 4, 5], "winningsDistribution": []}])     # faux : corrigé
    http = FakeHttp({"loto_201911": LOTO_2026, "nouveau_loto": LOTO_2017, "loto": LOTO_1976})

    report = archives.import_archives(db, ["loto"], check=True, http=http)
    assert report.added["loto"] == 0 and report.fixed["loto"] == 1 and db.draws.count_documents({}) == 2
    assert any("règles différentes" in s for s in report.skipped)

    report = archives.import_archives(db, ["loto"], http=http)
    assert db.draws.find_one({"_id": "loto-2026-11-11"})["extra"] == "scrapé"           # jamais remplacé
    fixed = db.draws.find_one({"_id": "loto-2017-03-04"})
    assert fixed["numbers"] == [4, 14, 28, 32, 37] and fixed["source"] == "archive"


def test_api_pagination_and_summary(client, db):
    g = GAMES["crescendo"]
    hours = [{"date": f"2026-11-07T{h}:00:01.000+01:00", "numbers": [str(h)], "complementariesNumbers": ["E"]}
             for h in range(13, 20)]
    DrawRepository(db).upsert("crescendo", [g.parse(r) for r in hours])
    # Pagination au sein d'une même journée (heure ISO du dernier tirage reçu)
    page = client.get("/api/draws/crescendo", query_string={"before": "2026-11-07T16:00:01+01:00"}).get_json()["data"]
    assert [d["time"] for d in page] == ["15:00", "14:00", "13:00"]
    assert client.get("/api/draws/crescendo", query_string={"before": "n'importe quoi"}).status_code == 400
    # Résumé : numéros seulement, pas de répartition des gains ni de champ interne
    summary = client.get("/api/draws/crescendo?summary=1&limit=5000").get_json()["data"]
    assert len(summary) == 7 and set(summary[0]) <= set(("id", "date", "time", "drawTime", "numbers", "letter"))


def test_api_one_draw_by_time(client, db):
    g = GAMES["crescendo"]
    hours = [{"date": f"2026-11-07T{h}:00:01.000+01:00", "numbers": [str(h)], "complementariesNumbers": ["E"]}
             for h in (13, 14, 15)]
    DrawRepository(db).upsert("crescendo", [g.parse(r) for r in hours])
    assert client.get("/api/draws/crescendo/2026-11-07").get_json()["data"]["time"] == "15:00"  # dernier du jour
    assert client.get("/api/draws/crescendo/2026-11-07?time=14:00").get_json()["data"]["numbers"] == [14]
    assert client.get("/api/draws/crescendo/2026-11-07?time=16:00").status_code == 404
    assert client.get("/api/draws/crescendo/2026-11-07?time=14h").status_code == 400
