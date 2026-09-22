"""
MetricSnapshot ORM model — represents a historical point-in-time metric reading.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MetricSnapshot(Base):
    """
    Historical point-in-time metrics for a specific target.
    """
    __tablename__ = "metric_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("targets.id", ondelete="CASCADE"), nullable=False
    )
    instance: Mapped[str] = mapped_column(String(60), nullable=False)
    cpu_usage_percent: Mapped[float] = mapped_column(Float, nullable=True)
    memory_usage_percent: Mapped[float] = mapped_column(Float, nullable=True)
    disk_usage_percent: Mapped[float] = mapped_column(Float, nullable=True)
    load_1m: Mapped[float] = mapped_column(Float, nullable=True)
    
    memory_total_bytes: Mapped[float] = mapped_column(Float, nullable=True)
    memory_available_bytes: Mapped[float] = mapped_column(Float, nullable=True)
    disk_total_bytes: Mapped[float] = mapped_column(Float, nullable=True)
    disk_free_bytes: Mapped[float] = mapped_column(Float, nullable=True)
    network_receive_rate: Mapped[float] = mapped_column(Float, nullable=True)
    network_transmit_rate: Mapped[float] = mapped_column(Float, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_metric_snapshots_target_id_recorded_at", "target_id", "recorded_at"),
    )
