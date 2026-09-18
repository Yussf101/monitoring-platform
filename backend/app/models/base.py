"""
Declarative base for all ORM models.

Every model class (Target, Alert, etc.) inherits from this Base.
Alembic also imports this Base to auto-detect table schemas
when generating migrations.

Architecture parallel (Java/Hibernate):
    Base ≈ the @MappedSuperclass or the persistence unit root.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class that all ORM models inherit from."""

    pass
