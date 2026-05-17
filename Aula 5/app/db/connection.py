import os

import asyncpg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@db:5432/alunos_db",
)


async def get_connection() -> asyncpg.Connection:
    return await asyncpg.connect(DATABASE_URL)
