"""Blueprints de l'API (mêmes URL et formats de réponse que l'ancien backend Express)."""

from __future__ import annotations

from typing import Any

from flask import jsonify, request

GAME_KEYS = ("euromillions", "loto", "eurodreams")


def body() -> dict[str, Any]:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def fail(message: str, status: int = 400, **extra):
    return jsonify(success=False, message=message, **extra), status


def int_arg(name: str, default: int, minimum: int = 0, maximum: int | None = None) -> int:
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError):
        value = default
    value = max(minimum, value)
    return min(value, maximum) if maximum else value


def bool_arg(name: str) -> bool | None:
    value = request.args.get(name)
    return None if value is None else value == "true"
