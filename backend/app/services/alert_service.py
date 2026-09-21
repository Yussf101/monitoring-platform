"""
Alert service — business logic for processing Alertmanager webhooks and querying alert history.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.models.target import Target
from app.schemas.alert import AlertmanagerWebhookPayload
from app.services.telegram_service import send_telegram_alert

logger = logging.getLogger(__name__)


def _parse_instance_ip(instance: str) -> str:
    """
    Extract the IP address from an Alertmanager ``instance`` label.

    Alertmanager sends instance as ``ip:port`` (e.g. ``192.168.28.133:9100``).
    Returns just the IP portion.
    """
    return instance.split(":")[0] if ":" in instance else instance


def _parse_iso_timestamp(raw: str) -> datetime | None:
    """
    Parse an ISO 8601 timestamp from Alertmanager.

    Returns None for the zero-value timestamp (``0001-01-01T00:00:00Z``)
    that Alertmanager uses to indicate "not yet resolved".
    """
    if raw.startswith("0001-01-01"):
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        logger.warning("Failed to parse timestamp: %s", raw)
        return None


async def _find_target_by_ip(db: AsyncSession, ip_address: str) -> Target | None:
    """Look up a target by its IP address. Returns None if not found."""
    result = await db.execute(
        select(Target).where(Target.ip_address == ip_address)
    )
    return result.scalar_one_or_none()


async def process_webhook(
    db: AsyncSession, payload: AlertmanagerWebhookPayload
) -> list[Alert]:
    """
    Process an incoming Alertmanager webhook payload.

    For each alert in the payload:
    - Resolve the target by parsing the instance IP from labels.
    - Firing alerts create a new Alert row.
    - Resolved alerts update the most recent firing alert for the same target and rule.
    - Unknown targets are logged and skipped (Alertmanager expects 200 regardless).

    Args:
        db: Active database session.
        payload: Validated webhook body from Alertmanager.

    Returns:
        List of Alert ORM objects that were created or updated.
    """
    processed: list[Alert] = []
    to_dispatch = []

    for alert_data in payload.alerts:
        alert_name = alert_data.labels.get("alertname", "unknown")
        severity = alert_data.labels.get("severity", "warning")
        instance = alert_data.labels.get("instance", "")
        ip_address = _parse_instance_ip(instance)

        target = await _find_target_by_ip(db, ip_address)
        if target is None:
            logger.warning(
                "No target found for IP %s (alert: %s) — skipping",
                ip_address,
                alert_name,
            )
            continue

        description = alert_data.annotations.get(
            "description", alert_data.annotations.get("summary", "")
        )

        if alert_data.status == "firing":
            # Check if there's already an active firing alert for this target + rule
            result = await db.execute(
                select(Alert)
                .where(
                    Alert.target_id == target.id,
                    Alert.alert_name == alert_name,
                    Alert.status == "firing",
                )
                .limit(1)
            )
            existing_firing = result.scalar_one_or_none()
            
            if existing_firing:
                # Alert is already firing; do not create duplicate DB row or send another notification.
                # Alertmanager is just repeating the webhook (e.g., due to group updates or repeat_interval).
                continue

            fired_at = _parse_iso_timestamp(alert_data.startsAt) or datetime.now(
                timezone.utc
            )
            alert_row = Alert(
                target_id=target.id,
                alert_name=alert_name,
                severity=severity,
                status="firing",
                message=description,
                fired_at=fired_at,
            )
            db.add(alert_row)
            processed.append(alert_row)
            to_dispatch.append({
                "alert_name": alert_name,
                "status": "firing",
                "instance": instance,
                "severity": severity,
                "message": description,
            })

        elif alert_data.status == "resolved":
            # Find the most recent firing alert for this target + rule
            result = await db.execute(
                select(Alert)
                .where(
                    Alert.target_id == target.id,
                    Alert.alert_name == alert_name,
                    Alert.status == "firing",
                )
                .order_by(Alert.fired_at.desc())
                .limit(1)
            )
            existing = result.scalar_one_or_none()

            resolved_at = _parse_iso_timestamp(alert_data.endsAt) or datetime.now(
                timezone.utc
            )

            if existing:
                existing.status = "resolved"
                existing.resolved_at = resolved_at
                processed.append(existing)
            else:
                # No matching firing alert — create a resolved record for completeness
                alert_row = Alert(
                    target_id=target.id,
                    alert_name=alert_name,
                    severity=severity,
                    status="resolved",
                    message=description,
                    fired_at=_parse_iso_timestamp(alert_data.startsAt)
                    or datetime.now(timezone.utc),
                    resolved_at=resolved_at,
                )
                db.add(alert_row)
                processed.append(alert_row)

            to_dispatch.append({
                "alert_name": alert_name,
                "status": "resolved",
                "instance": instance,
                "severity": severity,
                "message": description,
            })

    await db.commit()
    for alert_row in processed:
        await db.refresh(alert_row)
        
    # Dispatch Telegram notifications after successful DB commit
    for dispatch_data in to_dispatch:
        await send_telegram_alert(**dispatch_data)

    return processed


async def get_all_alerts(
    db: AsyncSession, limit: int = 50, offset: int = 0
) -> list[Alert]:
    """
    Retrieve paginated alert history, most recent first.

    Args:
        db: Active database session.
        limit: Maximum number of alerts to return.
        offset: Number of alerts to skip for pagination.

    Returns:
        List of Alert ORM objects.
    """
    result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def get_alerts_by_target(db: AsyncSession, target_id: int) -> list[Alert]:
    """
    Retrieve all alerts for a specific target, most recent first.

    Args:
        db: Active database session.
        target_id: The target's primary key.

    Returns:
        List of Alert ORM objects for the given target.
    """
    result = await db.execute(
        select(Alert)
        .where(Alert.target_id == target_id)
        .order_by(Alert.created_at.desc())
    )
    return list(result.scalars().all())
