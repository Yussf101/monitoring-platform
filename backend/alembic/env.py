"""
Alembic environment configuration for async SQLAlchemy.

This file tells Alembic how to connect to the database and which
ORM models to inspect when generating migrations.

Key concepts:
    - target_metadata: Alembic compares this metadata (from our models)
      against the actual database schema to auto-generate migration scripts.
    - run_async_migrations(): Uses asyncpg to run migrations asynchronously,
      matching our async FastAPI setup.
"""

import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

# Alembic runs as a CLI tool, so the project root (/app) may not be
# in Python's module search path. Add it explicitly so "from app.xxx"
# imports work correctly.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import context
from app.core.config import settings
from app.models.alert import Alert  # noqa: F401

# Import Base and ALL models so Alembic can detect their tables.
# Without these imports, Alembic would generate empty migrations.
from app.models.base import Base
from app.models.target import Target  # noqa: F401
from sqlalchemy.ext.asyncio import create_async_engine

# Standard Alembic logging setup
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is the metadata that Alembic compares against the live database.
# It contains the schema definitions from all our imported models.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations without a live database connection.

    Generates SQL scripts that can be applied manually.
    Useful for reviewing what changes would be made.
    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Execute migrations against a live database connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Create an async engine and run migrations.

    This is the async equivalent of Alembic's standard online migration.
    We create our own engine here (separate from the app's engine)
    because Alembic runs as a standalone CLI tool, not inside FastAPI.
    """
    connectable = create_async_engine(settings.DATABASE_URL)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online (live database) migrations."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
