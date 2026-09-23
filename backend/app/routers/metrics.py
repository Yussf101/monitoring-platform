"""
Metrics router — endpoints for querying metric snapshots.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.metric_snapshot import MetricAggregation, MetricSnapshotResponse
from app.services import metric_service

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])


@router.get(
    "/latest",
    response_model=list[MetricSnapshotResponse],
    summary="Get latest metrics",
    description="Retrieve the most recent metric snapshot for each target, or optionally filter by target_id.",
)
async def get_latest_metrics(
    target_id: int | None = Query(None, description="Optional target ID to filter by"),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest metrics for targets."""
    return await metric_service.get_latest_metrics(db, target_id=target_id)


@router.get(
    "/history/{target_id}",
    response_model=list[MetricSnapshotResponse],
    summary="Get metric history",
    description="Retrieve historical metric snapshots for a specific target, ordered by time descending.",
)
async def get_metric_history(
    target_id: int,
    hours: int = Query(24, description="Number of past hours to query"),
    limit: int = Query(500, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get time-series history for a target."""
    return await metric_service.get_metric_history(
        db, target_id=target_id, hours=hours, limit=limit
    )


@router.get(
    "/summary",
    response_model=list[MetricAggregation],
    summary="Get metric summary",
    description="Retrieve aggregated statistics (averages) per target over a given time window.",
)
async def get_metric_summary(
    target_id: int | None = Query(None, description="Optional target ID to filter by"),
    hours: int = Query(1, description="Number of past hours to aggregate"),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated metrics for targets."""
    return await metric_service.get_metric_summary(db, target_id=target_id, hours=hours)

