"""
Target ORM model — represents a monitored machine or service.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Target(Base):
    """
    A monitored target (server, VM, or service).

    Attributes:
        id: Auto-incrementing primary key.
        name: Human-readable label (e.g. "web-server-01").
        ip_address: IPv4 address of the target.
        port: Port where the metrics exporter listens (default 9100).
        os_type: Operating system — "linux" or "windows".
        environment: Deployment context — "production", "staging", etc.
        is_active: Whether Prometheus should currently scrape this target.
        created_at: Timestamp when the target was registered.
        updated_at: Timestamp of the last modification.
    """

    __tablename__ = "targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    port: Mapped[int] = mapped_column(Integer, nullable=False, default=9100)
    os_type: Mapped[str] = mapped_column(String(20), nullable=False, default="linux")
    environment: Mapped[str] = mapped_column(
        String(50), nullable=False, default="production"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
