"""Configuration des jeux et normalisation des données FDJ vers le format du front."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Callable
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")

JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre", "novembre", "décembre"]


# --------------------------------------------------------------------------- utils

def _val(v: Any) -> Any:
    """Les sentinelles RSC ($undefined, $NaN) et chaînes vides -> None."""
    if v in (None, "", "$undefined", "$NaN", "$null"):
        return None
    return v


def _int(v: Any) -> int | None:
    v = _val(v)
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def fmt_int(n: Any) -> str:
    n = _int(n)
    return "0" if n is None else f"{n:,}".replace(",", " ")


def fmt_money(v: Any) -> str:
    v = _val(v)
    if v is None:
        return "Non disponible"
    v = float(v)
    if v.is_integer():
        s = f"{int(v):,}".replace(",", " ")
    else:
        s = f"{v:,.2f}".replace(",", " ").replace(".", ",")
    return f"{s} €"


def fmt_jackpot(euros: float | None) -> str:
    if not euros:
        return "Non disponible"
    if euros >= 1_000_000:
        m = euros / 1_000_000
        s = f"{m:.1f}".rstrip("0").rstrip(".").replace(".", ",")
        return f"{s} million{'s' if m >= 2 else ''} €"
    return fmt_money(euros)


def _plural(n: int, word: str) -> str:
    return f"{n} {word}{'s' if n > 1 else ''}"


def parse_dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(PARIS)


def draw_date(s: str) -> date:
    return parse_dt(s).date()


def french_date(d: date) -> str:
    return f"{JOURS[d.weekday()]} {d.day} {MOIS[d.month - 1]} {d.year}"


def _flat_shares(shares: Any) -> list[dict]:
    out: list[dict] = []
    for s in shares or []:
        if isinstance(s, list):
            out.extend(x for x in s if isinstance(x, dict))
        elif isinstance(s, dict):
            out.append(s)
    return out


def _sorted_ints(values: Any) -> list[int]:
    return sorted(i for i in (_int(v) for v in values or []) if i is not None)


def _base(game: "Game", raw: dict) -> dict:
    d = draw_date(raw["date"])
    jackpot_cents = _int(raw.get("jackpotAmount"))
    return {
        "id": f"{game.prefix}-{d.isoformat()}",
        "date": d.isoformat(),
        "drawTime": parse_dt(raw["date"]).isoformat(),
        "formattedDate": french_date(d),
        "day": JOURS[d.weekday()],
        "drawNumber": _val(raw.get("externalId")),
        "numbers": _sorted_ints(raw.get("numbers")),
        "jackpotAmount": jackpot_cents / 100 if jackpot_cents else None,
    }


# --------------------------------------------------------------------------- jeux

def normalize_euromillions(game: "Game", raw: dict) -> dict:
    out = _base(game, raw)
    out["stars"] = _sorted_ints(raw.get("complementariesNumbers"))
    codes = raw.get("myMillion") or []
    out["myMillionCode"] = codes[0] if codes else None
    out["jackpot"] = fmt_jackpot(out["jackpotAmount"])

    dist, etoile_plus = [], []
    for s in _flat_shares(raw.get("shares")):
        n, k = _int(s.get("number")) or 0, _int(s.get("numberStar"))
        boards = s.get("winningBoards") or {}
        label = _plural(n, "numéro") + (f" + {_plural(k, 'étoile')}" if k else "")
        if s.get("winsetId") == 0:
            dist.append({
                "rank": len(dist) + 1,
                "combination": label,
                "winners": fmt_int(s.get("franceWinners")),
                "winnersEurope": fmt_int(s.get("europeWinners")),
                "amount": fmt_money(boards.get("amount")),
            })
        if _val(boards.get("starPlusAmount")) is not None:
            etoile_plus.append({
                "combination": label,
                "winners": fmt_int(s.get("starPlusWinners")),
                "amount": fmt_money(boards.get("starPlusAmount")),
            })
    out["winningsDistribution"] = dist
    out["etoilePlusDistribution"] = etoile_plus
    return out


def _loto_label(s: dict) -> str:
    num = str(s.get("number"))
    base = "0 ou 1 numéro" if num == "0/1" else _plural(_int(num) or 0, "numéro")
    return base + (" + numéro chance" if _val(s.get("chance")) else "")


def normalize_loto(game: "Game", raw: dict) -> dict:
    out = _base(game, raw)
    comp = _sorted_ints(raw.get("complementariesNumbers"))
    out["luckyNumber"] = comp[0] if comp else None
    opts = raw.get("options") or {}
    second = _sorted_ints(opts.get("numbers"))
    out["secondDraw"] = second or None
    joker = str(_val(opts.get("joker")) or "")
    out["jokerPlus"] = f"{joker[0]} {joker[1:4]} {joker[4:]}" if len(joker) == 7 else (joker or None)
    out["codesGagnants"] = list(raw.get("raffleCodes") or [])
    out["lotoType"] = _val(raw.get("lotoType")) or "loto"
    out["jackpot"] = fmt_jackpot(out["jackpotAmount"])

    dist, second_dist = [], []
    for s in _flat_shares(raw.get("shares")):
        if str(s.get("number")) == "Raffle":
            continue
        row = {
            "combination": _loto_label(s),
            "winners": fmt_int(s.get("winners")),
            "amount": fmt_money(s.get("amount")),
        }
        target = dist if s.get("winsetId") == 0 else second_dist
        target.append({"rank": len(target) + 1, **row})
    out["winningsDistribution"] = dist
    out["secondDrawDistribution"] = second_dist
    return out


def _pension(amount: Any, period: Any, duration: Any) -> str:
    per = "par an" if period == "year" else "par mois"
    s = f"{fmt_money(amount)} {per}"
    years = _int(duration)
    return f"{s} pendant {_plural(years, 'an')}" if years else s


def normalize_eurodreams(game: "Game", raw: dict) -> dict:
    out = _base(game, raw)
    # Les 6 numéros + le Dream Number (complementariesNumbers)
    out["numbers"] = out["numbers"][:6]
    comp = _sorted_ints(raw.get("complementariesNumbers"))
    out["dreamNumber"] = comp[0] if comp else None
    if out["jackpotAmount"]:
        out["jackpot"] = _pension(out["jackpotAmount"], "month", raw.get("jackpotDuration"))
    else:
        out["jackpot"] = "Non disponible"

    dist = []
    for s in _flat_shares(raw.get("shares")):
        if s.get("winsetId") != 0:
            continue
        n, dream = _int(s.get("number")) or 0, _int(s.get("numberDreams"))
        boards = s.get("winningBoards") or {}
        if _val(boards.get("pensionAmount")) is not None:
            amount = _pension(boards["pensionAmount"], boards.get("pensionPeriod"), boards.get("pensionDuration"))
        else:
            amount = fmt_money(boards.get("amount"))
        dist.append({
            "rank": len(dist) + 1,
            "combination": _plural(n, "numéro") + (" + dream number" if dream else ""),
            "winners": fmt_int(s.get("franceWinners")),
            "winnersEurope": fmt_int(s.get("europeWinners")),
            "amount": amount,
        })
    out["winningsDistribution"] = dist
    return out


@dataclass(frozen=True)
class Game:
    key: str              # clé dans resultats-cache.json
    prefix: str           # préfixe des ids ("em-2026-11-10")
    fdj_name: str         # gameName côté FDJ
    slug: str             # segment d'URL fdj.fr
    label: str
    normalize: Callable[["Game", dict], dict]
    exclude_announce: tuple[str, ...] = ()

    @property
    def results_path(self) -> str:
        return f"/jeux-de-tirage/{self.slug}/resultats"

    def dated_path(self, d: date) -> str:
        return f"{self.results_path}/{JOURS[d.weekday()]}-{d.day}-{MOIS[d.month - 1]}-{d.year}"

    def parse(self, raw: dict) -> dict:
        return self.normalize(self, raw)


GAMES: dict[str, Game] = {
    g.key: g for g in (
        Game("euromillions", "em", "euromillions", "euromillions-my-million", "EuroMillions",
             normalize_euromillions, exclude_announce=("draw-30",)),  # draw-30 = annonce My Million
        Game("loto", "loto", "loto", "loto", "Loto", normalize_loto),
        Game("eurodreams", "ed", "eurodreams", "eurodreams", "EuroDreams", normalize_eurodreams),
    )
}


def parse_announce(game: Game, data: Any) -> dict | None:
    """Prochain tirage annoncé (date + jackpot) pour le bandeau du front."""
    entries = [
        e for e in (data or [])
        if isinstance(e, dict) and e.get("date") and e.get("gameExternalId") not in game.exclude_announce
    ]
    if not entries:
        return None
    e = min(entries, key=lambda x: parse_dt(x["date"]))
    dt = parse_dt(e["date"])
    suffix = " ".join(" ".join(filter(None, (_val(e.get("suffix1")), _val(e.get("suffix2"))))).split())
    amount = _val(e.get("amount"))
    if amount and game.key == "eurodreams" and _int(e.get("duration")):
        amount = f"{amount} par mois pendant {e['duration']} ans"
    return {
        "date": dt.date().isoformat(),
        "drawTime": dt.isoformat(),
        "wageringEndsAt": _val(e.get("wageringEndsAt")),
        "formattedDate": french_date(dt.date()),
        "day": JOURS[dt.weekday()],
        "prefix": _val(e.get("prefix")),
        "jackpot": amount,
        "suffix": suffix or None,
        "lotoType": _val(e.get("lotoType")),
    }
