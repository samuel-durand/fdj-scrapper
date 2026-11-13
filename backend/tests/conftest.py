import sys
from pathlib import Path

import mongomock
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402


@pytest.fixture
def db():
    return mongomock.MongoClient(tz_aware=True).get_database("test")


@pytest.fixture
def app(db, tmp_path):
    cfg = Config(mongodb_uri="mongodb://test", jwt_secret="s" * 32, jwt_refresh_secret="r" * 32,
                 env="development", serve_frontend="false", dist_dir=tmp_path)
    return create_app(cfg, db=db)


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, name="Sam", email="sam@example.com", password="secret123"):
    res = client.post("/api/auth/register", json={"name": name, "email": email, "password": password})
    assert res.status_code == 201, res.get_json()
    return res.get_json()["data"]


@pytest.fixture
def user(client):
    data = register(client)
    return {"token": data["token"], "refresh": data["refreshToken"], "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['token']}"}}


@pytest.fixture
def admin(client, db):
    data = register(client, "Admin", "admin@example.com")
    db.users.update_one({"email": "admin@example.com"}, {"$set": {"role": "admin"}})
    return {"headers": {"Authorization": f"Bearer {data['token']}"}, "user": data["user"]}
