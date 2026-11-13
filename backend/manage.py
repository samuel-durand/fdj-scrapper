"""Commandes du backend.

    python backend/manage.py run                       # API (+ front compilé) en local
    python backend/manage.py scrape [--games loto] [--refresh]
    python backend/manage.py worker [--once]           # worker continu / un passage (cron)
    python backend/manage.py create-admin "Nom" email@exemple.fr "motdepasse"
    python backend/manage.py import-json resultats-cache.json   # reprendre l'ancien historique
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import Config  # noqa: E402
from app.db import connect, ensure_indexes, now  # noqa: E402

log = logging.getLogger("manage")


def setup_logging(verbose: bool = False) -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO,
                        format="%(asctime)s %(levelname)-7s %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_db():
    config = Config()
    if not config.mongodb_uri:  # le scraper n'a besoin que de la base (pas des secrets JWT)
        raise SystemExit("❌ MONGODB_URI manquant (backend/.env ou variable d'environnement)")
    db = connect(config.mongodb_uri, config.mongodb_db)
    ensure_indexes(db)
    return db


def cmd_run(args) -> int:
    from app import create_app
    app = create_app()
    # Avec --debug, Flask relance le serveur dans un processus enfant : on ne démarre la mise à
    # jour automatique que dans celui-ci (sinon elle tournerait deux fois).
    if args.auto_update and (not args.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"):
        from app import autoupdate
        autoupdate.start(app.extensions["mongo_db"])
    port = args.port or int(os.environ.get("PORT", 5000))
    app.run(host=args.host, port=port, debug=args.debug)
    return 0


def cmd_scrape(args) -> int:
    from app.worker import run_once
    report = run_once(get_db(), args.games, refresh=args.refresh)
    return 0 if report and not all(r.failed and r.latest is None for r in report.games.values()) else 1


def cmd_worker(args) -> int:
    from app.worker import run_forever, run_once
    db = get_db()
    if args.once:
        return 0 if run_once(db) else 1
    run_forever(db)
    return 0


def cmd_create_admin(args) -> int:
    from app.routes.auth import DEFAULT_PREFERENCES, validate_user
    from app.security import hash_password
    db = get_db()
    email = args.email.strip().lower()
    if error := validate_user(args.name, email, args.password):
        log.error("❌ %s", error)
        return 1
    existing = db.users.find_one({"email": email})
    if existing:
        db.users.update_one({"_id": existing["_id"]}, {"$set": {"role": "admin", "name": args.name, "updatedAt": now()}})
        log.info("✅ %s a été promu administrateur", email)
    else:
        ts = now()
        db.users.insert_one({"name": args.name, "email": email, "password": hash_password(args.password),
                             "role": "admin", "preferences": dict(DEFAULT_PREFERENCES), "isActive": True,
                             "createdAt": ts, "updatedAt": ts})
        log.info("✅ Compte administrateur créé : %s", email)
    return 0


def cmd_import_json(args) -> int:
    """Importe un ancien resultats-cache.json (garde l'historique que la FDJ ne publie plus)."""
    from app.scraper import GAMES, DrawRepository
    data = json.loads(Path(args.path).read_text(encoding="utf-8"))
    repo = DrawRepository(get_db())
    for key, game in GAMES.items():
        draws = []
        for d in data.get(key, []):
            if not d.get("date") or not d.get("numbers"):
                continue
            d = {**d, "id": f"{game.prefix}-{d['date']}"}
            if not args.overwrite and repo.get(key, d["date"]):
                continue  # la donnée scrapée (plus complète) est prioritaire
            draws.append(d)
        added, updated = repo.upsert(key, draws)
        log.info("%-12s +%d importés, %d mis à jour", game.label, len(added), updated)
    for key, announce in (data.get("nextDraws") or {}).items():
        if key in GAMES and announce and not repo.next_draws().get(key):
            repo.set_next_draw(key, announce)
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Backend Résultats Loterie")
    p.add_argument("-v", "--verbose", action="store_true")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("run", help="lancer l'API en local")
    s.add_argument("--host", default="127.0.0.1")
    s.add_argument("--port", type=int)
    s.add_argument("--debug", action="store_true")
    s.add_argument("--auto-update", action="store_true",
                   help="mettre à jour les tirages en arrière-plan (comme en production)")
    s.set_defaults(func=cmd_run)

    from app.scraper.games import GAMES
    s = sub.add_parser("scrape", help="mettre à jour les tirages")
    s.add_argument("--games", nargs="+", choices=list(GAMES))
    s.add_argument("--refresh", action="store_true", help="re-télécharger tous les tirages disponibles")
    s.set_defaults(func=cmd_scrape)

    s = sub.add_parser("worker", help="worker de mise à jour automatique")
    s.add_argument("--once", action="store_true", help="un seul passage puis quitter")
    s.set_defaults(func=cmd_worker)

    s = sub.add_parser("create-admin", help="créer ou promouvoir un administrateur")
    s.add_argument("name")
    s.add_argument("email")
    s.add_argument("password")
    s.set_defaults(func=cmd_create_admin)

    s = sub.add_parser("import-json", help="importer un ancien resultats-cache.json")
    s.add_argument("path")
    s.add_argument("--overwrite", action="store_true")
    s.set_defaults(func=cmd_import_json)

    args = p.parse_args()
    setup_logging(args.verbose)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
