"""
Async database engine and session management.

This module creates the SQLAlchemy async engine (powered by asyncpg)
and provides the `get_db` dependency that FastAPI injects into every
endpoint that needs database access.

Architecture parallel (Java/Spring):
    - AsyncEngine  ≈  DataSource / EntityManagerFactory
    - AsyncSession ≈  EntityManager / Hibernate Session
    - get_db()     ≈  @Autowired repository injection
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# The engine manages the connection pool to PostgreSQL.
# echo=False in production to avoid logging every SQL statement.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Session factory — creates new database sessions on demand.
# expire_on_commit=False keeps objects usable after commit
# (otherwise accessing obj.name after commit would trigger a lazy load error).
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session per request.

    Usage in a router:
        @router.get("/targets")
        async def list_targets(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed after the request completes,
    even if an exception occurs (thanks to the finally block).
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
