"""
Alert REST API endpoints.

Handles inbound Alertmanager webhooks and provides alert history queries.
"""

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.alert import AlertmanagerWebhookPayload, AlertRead
from app.services import alert_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.post(
    "/webhook",
    summary="Alertmanager webhook receiver",
    description=(
        "Receives alert notifications from Alertmanager. "
        "Persists each alert to the database and dispatches notifications. "
        "Always returns 200 to prevent Alertmanager retries."
    ),
)
async def receive_webhook(
    payload: AlertmanagerWebhookPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Process an Alertmanager webhook payload.

    Always returns HTTP 200 — Alertmanager retries on non-2xx responses,
    so partial failures must not cause a non-200 status.
    """
    try:
        processed = await alert_service.process_webhook(db, payload)
        return {"status": "ok", "processed": len(processed)}
    except Exception:
        logger.exception("Webhook processing failed")
        return {"status": "error", "processed": 0}


@router.get(
    "",
    response_model=list[AlertRead],
    summary="List alert history",
    description="Returns paginated alert history, most recent first.",
)
async def list_alerts(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await alert_service.get_all_alerts(db, limit=limit, offset=offset)


@router.get(
    "/target/{target_id}",
    response_model=list[AlertRead],
    summary="List alerts for a target",
    description="Returns all alerts associated with a specific target.",
)
async def list_alerts_by_target(
    target_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await alert_service.get_alerts_by_target(db, target_id)
