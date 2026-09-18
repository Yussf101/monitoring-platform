"""
Target REST API endpoints.

Architecture parallel (Java/Spring):
    This file ≈ a @RestController with @GetMapping, @PostMapping, etc.
    The `Depends(get_db)` ≈ Spring's @Autowired dependency injection.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.target import TargetCreate, TargetRead, TargetUpdate
from app.services import target_service

router = APIRouter(prefix="/api/targets", tags=["Targets"])


@router.get(
    "",
    response_model=list[TargetRead],
    summary="List all targets",
    description="Returns every registered monitoring target.",
)
async def list_targets(db: AsyncSession = Depends(get_db)):
    return await target_service.get_all_targets(db)


@router.get(
    "/{target_id}",
    response_model=TargetRead,
    summary="Get a target by ID",
    description="Returns a single target by its primary key.",
)
async def get_target(target_id: int, db: AsyncSession = Depends(get_db)):
    return await target_service.get_target_by_id(db, target_id)


@router.post(
    "",
    response_model=TargetRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new target",
    description="Adds a new server/VM/service to be monitored by Prometheus.",
)
async def create_target(data: TargetCreate, db: AsyncSession = Depends(get_db)):
    return await target_service.create_target(db, data)


@router.patch(
    "/{target_id}",
    response_model=TargetRead,
    summary="Update a target",
    description="Partially updates an existing target. Only send the fields you want to change.",
)
async def update_target(
    target_id: int, data: TargetUpdate, db: AsyncSession = Depends(get_db)
):
    return await target_service.update_target(db, target_id, data)


@router.delete(
    "/{target_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a target",
    description="Removes a target and all its associated alert history.",
)
async def delete_target(target_id: int, db: AsyncSession = Depends(get_db)):
    await target_service.delete_target(db, target_id)
