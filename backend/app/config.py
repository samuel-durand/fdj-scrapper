"""Configuration lue depuis les variables d'environnement (et backend/.env)."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")

_UNITS = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}


def parse_duration(value: str | None, default: str) -> timedelta:
    """'7d', '12h', '30m', '3600' (secondes) -> timedelta (format de jsonwebtoken)."""
    m = re.fullmatch(r"\s*(\d+)\s*([smhdw]?)\s*", value or default)
    if not m:
        m = re.fullmatch(r"(\d+)([smhdw]?)", default)
    return timedelta(seconds=int(m.group(1)) * _UNITS.get(m.group(2) or "s", 1))


@dataclass
class Config:
    mongodb_uri: str = field(default_factory=lambda: os.environ.get("MONGODB_URI", ""))
    mongodb_db: str = field(default_factory=lambda: os.environ.get("MONGODB_DB", "loterie"))
    jwt_secret: str = field(default_factory=lambda: os.environ.get("JWT_SECRET", ""))
    jwt_refresh_secret: str = field(default_factory=lambda: os.environ.get("JWT_REFRESH_SECRET", ""))
    jwt_expire: timedelta = field(default_factory=lambda: parse_duration(os.environ.get("JWT_EXPIRE"), "7d"))
    jwt_refresh_expire: timedelta = field(
        default_factory=lambda: parse_duration(os.environ.get("JWT_REFRESH_EXPIRE"), "30d")
    )
    env: str = field(default_factory=lambda: os.environ.get("APP_ENV") or os.environ.get("NODE_ENV") or "development")
    frontend_urls: list[str] = field(
        default_factory=lambda: [u.strip() for u in os.environ.get("FRONTEND_URL", "").split(",") if u.strip()]
    )
    serve_frontend: str = field(default_factory=lambda: os.environ.get("SERVE_FRONTEND", "auto").lower())
    dist_dir: Path = ROOT_DIR / "dist"

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    def validate(self) -> None:
        missing = [name for name, val in (
            ("MONGODB_URI", self.mongodb_uri),
            ("JWT_SECRET", self.jwt_secret),
            ("JWT_REFRESH_SECRET", self.jwt_refresh_secret),
        ) if not val]
        if missing:
            raise RuntimeError(
                f"Variables manquantes : {', '.join(missing)}. "
                "Copiez backend/.env.example en backend/.env et remplissez-le."
            )
