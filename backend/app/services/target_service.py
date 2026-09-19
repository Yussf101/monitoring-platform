"""
Target service — business logic for CRUD operations on targets.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.target import Target
from app.schemas.target import TargetCreate, TargetUpdate


async def get_all_targets(db: AsyncSession) -> list[Target]:
    """
    Retrieve all targets from the database.

    Returns:
        List of Target ORM objects.
    """
    result = await db.execute(select(Target).order_by(Target.id))
    return list(result.scalars().all())


async def get_target_by_id(db: AsyncSession, target_id: int) -> Target:
    """
    Retrieve a single target by its primary key.

    Args:
        db: Active database session.
        target_id: The target's primary key.

    Returns:
        The Target ORM object.

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
