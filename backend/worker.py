"""Background worker entry point for maintenance and long-running jobs."""

from __future__ import annotations

import asyncio
import logging

from backend.core.database import database

logger = logging.getLogger("prepzy.worker")


async def maintenance_loop() -> None:
    await database.connect()
    logger.info("Prepzy worker started")
    try:
        while True:
            # Reserved for cache pruning, expired OTP cleanup, report generation,
            # and queued OCR jobs. Keeping this loop explicit makes the worker
            # independently deployable without coupling it to web requests.
            await asyncio.sleep(60)
    finally:
        await database.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(maintenance_loop())
