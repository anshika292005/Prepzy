from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("OTP_SECRET", "test-secret")
os.environ.setdefault("MONGO_URI", "mongodb://127.0.0.1:1/prepzy-test")

from backend.core.config import get_settings
from backend.core.database import database
from backend.main import app


@pytest.fixture(autouse=True)
def clear_state():
    get_settings.cache_clear()
    database.connected = False
    database.mongo = None
    database.client = None
    database.memory.clear()
    yield
    database.memory.clear()


@pytest.fixture
def client():
    with TestClient(app) as value:
        yield value


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer dev:test-user"}
