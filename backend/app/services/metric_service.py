"""
Metric service — business logic for metric snapshots.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.metric_snapshot import MetricSnapshot


async def get_latest_metrics(db: AsyncSession, target_id: int | None = None) -> list[MetricSnapshot]:
    """
    Retrieve the latest metric snapshot per target, optionally filtered by target_id.
    """
    # Subquery to find the maximum recorded_at for each target
    subq = select(
        MetricSnapshot.target_id,
        func.max(MetricSnapshot.recorded_at).label("max_recorded_at")
    ).group_by(MetricSnapshot.target_id)
    
    if target_id is not None:
        subq = subq.where(MetricSnapshot.target_id == target_id)
        
    subq = subq.subquery()

    # Join the main table with the subquery to get the full row
    stmt = select(MetricSnapshot).join(
        subq,
        (MetricSnapshot.target_id == subq.c.target_id) &
        (MetricSnapshot.recorded_at == subq.c.max_recorded_at)
    ).order_by(MetricSnapshot.target_id)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_metric_history(
    db: AsyncSession, target_id: int, hours: int = 24, limit: int = 500
) -> list[MetricSnapshot]:
    """
    Retrieve historical metric snapshots for a specific target.
    """
    time_threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    stmt = (
        select(MetricSnapshot)
        .where(
            MetricSnapshot.target_id == target_id,
            MetricSnapshot.recorded_at >= time_threshold
        )
        .order_by(desc(MetricSnapshot.recorded_at))
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_metric_summary(
    db: AsyncSession, target_id: int | None = None, hours: int = 1
) -> list[dict]:
    """
    Retrieve aggregated metric statistics per target over a given time window.
    """
    time_threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    stmt = select(
        MetricSnapshot.target_id,
        func.avg(MetricSnapshot.cpu_usage_percent).label("avg_cpu"),
        func.avg(MetricSnapshot.memory_usage_percent).label("avg_memory"),
        func.avg(MetricSnapshot.disk_usage_percent).label("avg_disk"),
        func.avg(MetricSnapshot.load_1m).label("avg_load"),
        func.min(MetricSnapshot.recorded_at).label("min_recorded_at"),
        func.max(MetricSnapshot.recorded_at).label("max_recorded_at"),
        func.count(MetricSnapshot.id).label("sample_count")
    ).where(MetricSnapshot.recorded_at >= time_threshold)
    
    if target_id is not None:
        stmt = stmt.where(MetricSnapshot.target_id == target_id)
        
    stmt = stmt.group_by(MetricSnapshot.target_id)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            "target_id": row.target_id,
            "avg_cpu": row.avg_cpu,
            "avg_memory": row.avg_memory,
            "avg_disk": row.avg_disk,
            "avg_load": row.avg_load,
            "min_recorded_at": row.min_recorded_at,
            "max_recorded_at": row.max_recorded_at,
            "sample_count": row.sample_count
        }
        for row in rows
    ]
