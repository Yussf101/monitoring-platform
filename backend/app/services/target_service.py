import logging
import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.target import Target
from app.schemas.target import TargetCreate, TargetUpdate

logger = logging.getLogger(__name__)


async def get_prometheus_targets_health(
    prometheus_url: str = settings.PROMETHEUS_URL,
) -> dict[str, dict]:
    """
    Query Prometheus /api/v1/targets to retrieve live scrape health for all active targets.

    Returns:
        Mapping of endpoint ('ip:port') to dict with 'health', 'last_error', 'last_scrape'.
    """
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{prometheus_url.rstrip('/')}/api/v1/targets")
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                active_targets = data.get("activeTargets", [])
                health_map: dict[str, dict] = {}
                for t in active_targets:
                    labels = t.get("labels", {})
                    instance = labels.get("instance") or t.get("discoveredLabels", {}).get("__address__")
                    if instance:
                        health_map[instance] = {
                            "health": t.get("health", "unknown"),
                            "last_error": t.get("lastError"),
                            "last_scrape": t.get("lastScrape"),
                        }
                return health_map
    except Exception as exc:
        logger.debug("Failed to query Prometheus targets health: %s", exc)
    return {}


def _annotate_target_health(target: Target, health_map: dict[str, dict]) -> Target:
    """Attach live Prometheus health metadata to a Target model instance."""
    if not target.is_active:
        target.health = "muted"
        target.last_error = None
        target.last_scrape = None
    else:
        endpoint = f"{target.ip_address}:{target.port}"
        p_info = health_map.get(endpoint)
        if p_info:
            target.health = p_info.get("health", "unknown")
            target.last_error = p_info.get("last_error")
            target.last_scrape = p_info.get("last_scrape")
        else:
            target.health = "unknown"
            target.last_error = None
            target.last_scrape = None
    return target


async def get_all_targets(db: AsyncSession) -> list[Target]:
    """
    Retrieve all targets from the database with live Prometheus scrape health.

    Returns:
        List of Target ORM objects annotated with health, last_error, and last_scrape.
    """
    result = await db.execute(select(Target).order_by(Target.id))
    targets = list(result.scalars().all())
    health_map = await get_prometheus_targets_health()
    for t in targets:
        _annotate_target_health(t, health_map)
    return targets


async def get_target_by_id(db: AsyncSession, target_id: int) -> Target:
    """
    Retrieve a single target by its primary key with live health.

    Args:
        db: Active database session.
        target_id: The target's primary key.

    Returns:
        The Target ORM object with live health annotations.

    Raises:
        HTTPException 404: If no target exists with the given ID.
    """
    result = await db.execute(select(Target).where(Target.id == target_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with id {target_id} not found",
        )
    health_map = await get_prometheus_targets_health()
    _annotate_target_health(target, health_map)
    return target


async def create_target(db: AsyncSession, data: TargetCreate) -> Target:
    """
    Create a new target and persist it to the database.

    Args:
        db: Active database session.
        data: Validated target creation data from the request body.

    Returns:
        The newly created Target ORM object (with generated id and timestamps).
    """
    target = Target(**data.model_dump())
    db.add(target)
    await db.commit()
    await db.refresh(target)
    health_map = await get_prometheus_targets_health()
    _annotate_target_health(target, health_map)
    return target


async def update_target(
    db: AsyncSession, target_id: int, data: TargetUpdate
) -> Target:
    """
    Partially update an existing target.

    Only fields that are explicitly provided (non-None) in the request
    body will be updated. This implements the PATCH semantics.

    Args:
        db: Active database session.
        target_id: The target's primary key.
        data: Validated partial update data.

    Returns:
        The updated Target ORM object.

    Raises:
        HTTPException 404: If no target exists with the given ID.
    """
    target = await get_target_by_id(db, target_id)

    # Only update fields that were explicitly sent in the request
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(target, field, value)

    await db.commit()
    await db.refresh(target)
    health_map = await get_prometheus_targets_health()
    _annotate_target_health(target, health_map)
    return target


async def delete_target(db: AsyncSession, target_id: int) -> None:
    """
    Delete a target by its primary key.

    Args:
        db: Active database session.
        target_id: The target's primary key.

    Raises:
        HTTPException 404: If no target exists with the given ID.
    """
    target = await get_target_by_id(db, target_id)
    await db.delete(target)
    await db.commit()
