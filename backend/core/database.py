from __future__ import annotations

import asyncio
from collections import defaultdict
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from backend.core.config import get_settings


class MemoryCollection:
    """Small async Mongo-like fallback used when MongoDB is unavailable."""

    def __init__(self) -> None:
        self.documents: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    @staticmethod
    def _matches(document: dict[str, Any], query: dict[str, Any]) -> bool:
        for key, expected in query.items():
            actual = document.get(key)
            if isinstance(expected, dict):
                if "$in" in expected and actual not in expected["$in"]:
                    return False
                if "$gte" in expected and (actual is None or actual < expected["$gte"]):
                    return False
                if "$lte" in expected and (actual is None or actual > expected["$lte"]):
                    return False
            elif actual != expected:
                return False
        return True

    async def insert_one(self, document: dict[str, Any]) -> dict[str, Any]:
        async with self._lock:
            value = deepcopy(document)
            value.setdefault("_id", uuid4().hex)
            value.setdefault("created_at", datetime.now(timezone.utc).isoformat())
            self.documents[str(value["_id"])] = value
            return deepcopy(value)

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        for document in self.documents.values():
            if self._matches(document, query):
                return deepcopy(document)
        return None

    async def find_many(
        self,
        query: dict[str, Any] | None = None,
        *,
        sort_key: str | None = None,
        descending: bool = False,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        query = query or {}
        values = [
            deepcopy(document)
            for document in self.documents.values()
            if self._matches(document, query)
        ]
        if sort_key:
            values.sort(key=lambda item: item.get(sort_key, ""), reverse=descending)
        return values[:limit] if limit else values

    async def update_one(
        self,
        query: dict[str, Any],
        updates: dict[str, Any],
        *,
        upsert: bool = False,
    ) -> dict[str, Any] | None:
        async with self._lock:
            existing_id = next(
                (
                    identifier
                    for identifier, document in self.documents.items()
                    if self._matches(document, query)
                ),
                None,
            )
            if existing_id is None:
                if not upsert:
                    return None
                value = {**query, **updates, "_id": uuid4().hex}
                value.setdefault("created_at", datetime.now(timezone.utc).isoformat())
                self.documents[value["_id"]] = value
                return deepcopy(value)
            self.documents[existing_id].update(deepcopy(updates))
            self.documents[existing_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
            return deepcopy(self.documents[existing_id])

    async def delete_many(self, query: dict[str, Any]) -> int:
        async with self._lock:
            identifiers = [
                identifier
                for identifier, document in self.documents.items()
                if self._matches(document, query)
            ]
            for identifier in identifiers:
                self.documents.pop(identifier, None)
            return len(identifiers)


class Database:
    def __init__(self) -> None:
        self.client: Any = None
        self.mongo: Any = None
        self.connected = False
        self.memory: defaultdict[str, MemoryCollection] = defaultdict(MemoryCollection)

    async def connect(self) -> None:
        settings = get_settings()
        try:
            from motor.motor_asyncio import AsyncIOMotorClient

            self.client = AsyncIOMotorClient(
                settings.mongo_uri,
                serverSelectionTimeoutMS=2000,
                uuidRepresentation="standard",
            )
            await self.client.admin.command("ping")
            self.mongo = self.client[settings.mongo_database]
            self.connected = True
        except Exception:
            self.client = None
            self.mongo = None
            self.connected = False

    async def close(self) -> None:
        if self.client:
            self.client.close()
        self.connected = False

    def collection(self, name: str) -> Any:
        return self.mongo[name] if self.connected else self.memory[name]


database = Database()
