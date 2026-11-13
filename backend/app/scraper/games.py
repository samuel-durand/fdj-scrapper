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


def _shares(raw: dict) -> list:
    """Liste des gains. La FDJ remplace parfois une liste déjà envoyée dans la page par une
    référence interne ("$…") : on la traite alors comme absente (voir Scraper._page_draws)."""
    shares = raw.get("shares")
    return shares if isinstance(shares, list) else []


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


def draw_id(game: "Game", dt: datetime) -> str:
    """Id d'un tirage : "em-2026-11-10", ou "amigo-2026-11-13-1935" pour les jeux à plusieurs tirages par jour."""
    base = f"{game.prefix}-{dt.date().isoformat()}"
    return f"{base}-{dt.strftime('%H%M')}" if game.intraday else base


def _base(game: "Game", raw: dict) -> dict:
    dt = parse_dt(raw["date"])
    d = dt.date()
    jackpot_cents = _int(raw.get("jackpotAmount"))
    out = {
        "id": draw_id(game, dt),
        "date": d.isoformat(),
        "drawTime": dt.isoformat(),
        "formattedDate": french_date(d),
        "day": JOURS[d.weekday()],
        "drawNumber": _val(raw.get("externalId")),
        "numbers": _sorted_ints(raw.get("numbers")),
        "jackpotAmount": jackpot_cents / 100 if jackpot_cents else None,
    }
    if game.intraday:
        out["time"] = dt.strftime("%H:%M")
        out["intradayNumber"] = _int(raw.get("intraDayDrawNumber"))
    return out


def _clean_amount(v: Any) -> str | None:
    """Montants déjà formatés par la FDJ ("200 000 €") : espaces insécables -> espaces."""
    v = _val(v)
    return " ".join(str(v).replace(" ", " ").replace("\xa0", " ").split()) if v is not None else None


def _joker(v: Any) -> str | None:
    s = str(_val(v) or "")
    return f"{s[0]} {s[1:4]} {s[4:]}" if len(s) == 7 else (s or None)


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
    out["jokerPlus"] = _joker(opts.get("joker"))
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


def normalize_keno(game: "Game", raw: dict) -> dict:
    """Keno : 16 numéros sur 56, gains fixes selon la grille jouée et la mise (pas de nombre de gagnants)."""
    out = _base(game, raw)
    opts = raw.get("options") or {}
    out["multiplier"] = _int(opts.get("multiplier"))
    out["jokerPlus"] = _joker(opts.get("joker"))

    stakes: set[str] = set()
    for s in _shares(raw):
        for b in s.get("winningBoards") or []:
            stakes.update((b.get("betAmounts") or {}).keys())
    stake_keys = sorted(stakes, key=lambda k: _int(k) or 0)

    grids = []
    for s in sorted(_shares(raw), key=lambda x: -(_int(x.get("numbersDrawn")) or 0)):
        played = _int(s.get("numbersDrawn")) or 0
        rows = []
        for b in sorted(s.get("winningBoards") or [], key=lambda x: -(_int(x.get("numbersPlayed")) or 0)):
            matched = _int(b.get("numbersPlayed")) or 0
            bets = b.get("betAmounts") or {}
            amounts = []
            for k in stake_keys:
                bet = bets.get(k) or {}
                amount = _clean_amount(bet.get("amount")) or "—"
                pension = _clean_amount(bet.get("pensionAmount"))
                if pension:
                    per = "par an" if bet.get("pensionPeriod") == "year" else "par mois"
                    amount = f"{amount} ou {pension} {per} à vie"
                amounts.append(amount)
            rows.append({"combination": _plural(matched, "bon numéro").replace("bon numéros", "bons numéros"),
                         "amounts": amounts})
        grids.append({"id": str(played), "label": f"{played} numéros joués", "rows": rows})

    if not grids:
        out["payouts"] = None
        return out
    out["payouts"] = {"stakeTitle": "Gain pour une mise de", "stakes": [f"{k} €" for k in stake_keys], "grids": grids}
    return out


_CRESCENDO_LABELS = {"Lettre": "Lettre seule"}


def _crescendo_label(name: str) -> str:
    if name in _CRESCENDO_LABELS:
        return _CRESCENDO_LABELS[name]
    n, _, rest = name.partition("/")
    good = _int(n.strip()) or 0
    return _plural(good, "bon numéro").replace("bon numéros", "bons numéros") + (" + lettre" if "+ L" in rest else "")


def normalize_crescendo(game: "Game", raw: dict) -> dict:
    """Crescendo : 10 numéros sur 25 + 1 lettre, 7 tirages le samedi (13h → 19h)."""
    out = _base(game, raw)
    letters = [str(x) for x in raw.get("complementariesNumbers") or [] if _val(x)]
    out["letter"] = letters[0] if letters else None
    out["jackpot"] = fmt_jackpot(out["jackpotAmount"])
    out["winningsDistribution"] = [
        {
            "rank": _int(s.get("divisionId")) or i + 1,
            "combination": _crescendo_label(str(s.get("divisionName") or "")),
            "winners": fmt_int(s.get("winners")),
            "amount": fmt_money(s.get("winningAmount")),
        }
        for i, s in enumerate(sorted(_shares(raw), key=lambda x: _int(x.get("divisionId")) or 0))
    ]
    return out


def normalize_amigo(game: "Game", raw: dict) -> dict:
    """Amigo : 7 numéros bleus + 5 jaunes sur 28, un tirage toutes les 5 minutes, gains fixes."""
    out = _base(game, raw)
    out["yellowNumbers"] = _sorted_ints(raw.get("complementariesNumbers"))
    grids = []
    for s in sorted(_shares(raw), key=lambda x: -(_int(x.get("numbersDrawn")) or 0)):
        good = _int(s.get("numbersDrawn")) or 0
        rows = []
        for b in s.get("board") or []:
            blue, yellow = _int(b.get("blueNumbers")) or 0, _int(b.get("yellowNumbers")) or 0
            parts = [p for p in (_plural(blue, "bleu") if blue else "", _plural(yellow, "jaune") if yellow else "") if p]
            rows.append({"combination": " + ".join(parts), "amounts": [_clean_amount(w) or "—" for w in b.get("winnings") or []]})
        if rows:
            grids.append({"id": str(good), "label": _plural(good, "bon numéro").replace("bon numéros", "bons numéros"),
                          "rows": rows})
    if not grids:
        out["payouts"] = None  # référence vers le barème d'un autre tirage de la page
        return out
    n = max((len(r["amounts"]) for g in grids for r in g["rows"]), default=0)
    out["payouts"] = {"stakeTitle": "Gain selon la mise", "stakes": [f"Mise ×{i + 1}" for i in range(n)], "grids": grids}
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
    intraday: bool = False            # plusieurs tirages par jour (Crescendo, Amigo)
    history_days: int | None = None   # limite du rattrapage de l'historique (None = tout ce que publie la FDJ)

    def is_complete(self, draw: dict) -> bool:
        """Tirage complet = répartition (ou barème) des gains connue."""
        return bool(draw.get("winningsDistribution") or draw.get("payouts"))

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
        Game("keno", "keno", "keno", "keno", "Keno", normalize_keno),
        Game("crescendo", "cr", "crescendo", "crescendo", "Crescendo", normalize_crescendo, intraday=True),
        # ~200 tirages par jour et 2 Mo par page : on se limite à une semaine d'historique.
        Game("amigo", "amigo", "amigo", "amigo", "Amigo", normalize_amigo, intraday=True, history_days=7),
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
    out = {
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
    if game.intraday:
        out["time"] = dt.strftime("%H:%M")
    return out
