"""Create indexes required by the unified backend.

The legacy TypeScript service and the Python service use the same logical
collection names, so no destructive data rewrite is required. This command is
idempotent and can be run during every deployment.
"""

from __future__ import annotations

import asyncio
import logging

from backend.core.database import database

logger = logging.getLogger("prepzy.migrate")


async def migrate() -> None:
    await database.connect()
    if not database.connected:
        logger.warning("MongoDB is unavailable; no indexes were created.")
        return
    definitions = {
        "user_profiles": [
            ([("auth_id", 1)], {"unique": True, "name": "user_auth_id_unique"}),
        ],
        "sessions": [
            ([("user_id", 1), ("created_at", -1)], {"name": "session_history"}),
            ([("topic", 1), ("exam_type", 1)], {"name": "session_filters"}),
        ],
        "question_responses": [
            ([("session_id", 1), ("created_at", 1)], {"name": "session_responses"}),
        ],
        "skill_scores": [
            (
                [("user_id", 1), ("topic", 1), ("subtopic", 1)],
                {"unique": True, "name": "skill_identity"},
            ),
        ],
        "login_otps": [
            ([("expires_at", 1)], {"expireAfterSeconds": 0, "name": "otp_ttl"}),
        ],
        "conversation_messages": [
            ([("session_id", 1), ("created_at", 1)], {"name": "conversation_history"}),
        ],
    }
    for collection_name, indexes in definitions.items():
        collection = database.mongo[collection_name]
        for keys, options in indexes:
            name = await collection.create_index(keys, **options)
            logger.info("Index ready: %s.%s", collection_name, name)
    await database.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(migrate())
