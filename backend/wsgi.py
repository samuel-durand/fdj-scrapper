"""Point d'entrée WSGI pour la production.

    gunicorn --chdir backend wsgi:app --bind 0.0.0.0:$PORT --workers 2
    (Windows : waitress-serve --listen=*:5000 --call wsgi:create_app)

La mise à jour des tirages tourne dans le serveur web (app/autoupdate.py) : aucun worker ni
GitHub Action n'est nécessaire. AUTO_UPDATE=false la désactive (si un worker séparé tourne).
"""

import logging
import os

from app import autoupdate, create_app

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-7s %(name)s %(message)s")

app = create_app()

if os.environ.get("AUTO_UPDATE", "true").lower() not in ("0", "false", "no"):
    autoupdate.start(app.extensions["mongo_db"])
