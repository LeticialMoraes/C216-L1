import asyncio
import os
import time

import asyncpg
import pytest
from fastapi.testclient import TestClient

from app.main import app

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/alunos_db",
)


async def _wait_for_db(max_attempts: int = 30) -> None:
    for _ in range(max_attempts):
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            await conn.close()
            return
        except (OSError, asyncpg.PostgresConnectionError):
            await asyncio.sleep(1)
    raise RuntimeError("PostgreSQL não ficou disponível a tempo para os testes")


@pytest.fixture(scope="session", autouse=True)
def wait_for_database() -> None:
    asyncio.run(_wait_for_db())


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
