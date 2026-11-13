"""Point d'entrée WSGI pour la production.

    gunicorn --chdir backend wsgi:app --bind 0.0.0.0:$PORT --workers 2
    (Windows : waitress-serve --listen=*:5000 --call wsgi:create_app)
"""

import logging

from app import create_app

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-7s %(name)s %(message)s")

app = create_app()
