"""Application Flask : API REST + (optionnel) service du front compilé."""

from __future__ import annotations

import gzip
import logging
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pymongo.database import Database
from werkzeug.exceptions import HTTPException

from .config import Config
from .db import connect, ensure_indexes
from .serialize import MongoJSONProvider

log = logging.getLogger(__name__)


def create_app(config: Config | None = None, db: Database | None = None) -> Flask:
    config = config or Config()
    if db is None:
        config.validate()
        db = connect(config.mongodb_uri, config.mongodb_db)
    ensure_indexes(db)

    app = Flask(__name__, static_folder=None)
    app.json_provider_class = MongoJSONProvider
    app.json = MongoJSONProvider(app)
    app.config["APP"] = config
    app.extensions["mongo_db"] = db

    _setup_cors(app, config)

    from .routes import admin, alerts, auth, combinations, draws, notifications, users
    for module in (auth, users, alerts, notifications, combinations, admin, draws):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        db.command("ping")
        return jsonify(status="OK", message="Server is running")

    @app.errorhandler(HTTPException)
    def http_error(exc: HTTPException):
        if request.path.startswith("/api/"):
            message = "Route API non trouvée" if exc.code == 404 else exc.description
            return jsonify(success=False, message=message), exc.code
        return exc

    @app.errorhandler(Exception)
    def server_error(exc: Exception):
        log.exception("Erreur serveur sur %s", request.path)
        message = str(exc) if not config.is_production else "Erreur interne du serveur"
        return jsonify(success=False, message=message), 500

    _setup_compression(app)
    _setup_frontend(app, config)
    return app


def _setup_compression(app: Flask) -> None:
    """Compresse les réponses JSON (les listes de tirages se réduisent d'environ 90 %)."""

    @app.after_request
    def gzip_json(resp):
        if (
            resp.status_code != 200
            or resp.direct_passthrough
            or resp.mimetype != "application/json"
            or "gzip" not in request.headers.get("Accept-Encoding", "").lower()
            or "Content-Encoding" in resp.headers
        ):
            return resp
        data = resp.get_data()
        if len(data) < 1024:
            return resp
        resp.set_data(gzip.compress(data, compresslevel=6))
        resp.headers["Content-Encoding"] = "gzip"
        resp.vary.add("Accept-Encoding")
        return resp


def _setup_cors(app: Flask, config: Config) -> None:
    if config.is_production:
        origins = config.frontend_urls or []
    else:
        origins = config.frontend_urls + [r"http://localhost:\d+", r"http://127\.0\.0\.1:\d+"]
    if origins:
        CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True,
             allow_headers=["Content-Type", "Authorization"],
             methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])


def _setup_frontend(app: Flask, config: Config) -> None:
    """Sert dist/ (build Vite) : un seul serveur pour le site et l'API."""
    dist: Path = config.dist_dir
    enabled = config.serve_frontend == "true" or (config.serve_frontend == "auto" and (dist / "index.html").exists())
    if not enabled:
        return

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path: str):
        if path.startswith("api/"):
            return jsonify(success=False, message="Route API non trouvée"), 404
        file = dist / path
        if path and file.is_file():
            resp = send_from_directory(dist, path)
            if path.startswith("assets/"):  # fichiers versionnés par Vite
                resp.cache_control.max_age = 31536000
                resp.cache_control.immutable = True
            return resp
        resp = send_from_directory(dist, "index.html")
        resp.cache_control.no_cache = True
        return resp
