"""
Alert ORM model — stores alert history from Alertmanager.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Alert(Base):
    """
    An alert event linked to a specific target.

    Attributes:
        id: Auto-incrementing primary key.
        target_id: Foreign key to the target that triggered the alert.
        alert_name: Name of the alerting rule (e.g. "HighCpuUsage").
        severity: Alert level — "critical", "warning", or "info".
        status: Current state — "firing" or "resolved".
        message: Human-readable description of what happened.
        fired_at: When the alert was first triggered.
        resolved_at: When the alert was resolved (null if still firing).
        created_at: When this record was inserted into the database.
    """

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("targets.id", ondelete="CASCADE"), nullable=False
    )
    alert_name: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="warning"
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="firing")
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
