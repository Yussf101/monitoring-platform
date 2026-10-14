"""
Alert service — business logic for processing Alertmanager webhooks and querying alert history.
"""

import asyncio
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.alert import Alert
from app.models.target import Target
from app.schemas.alert import AlertmanagerWebhookPayload
from app.services.telegram_service import send_telegram_alert

logger = logging.getLogger(__name__)


async def is_target_reachable(
    ip_address: str, port: int = 9100, timeout: float = 2.0
) -> bool:
    """
    Check if a target's scrape port is genuinely reachable via TCP.

    Used to guard against false Alertmanager resolutions caused by resolve_timeout
    expirations during laptop sleep or network pauses.
    """
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(ip_address, port),
            timeout=timeout,
        )
        writer.close()
        await writer.wait_closed()
        return True
    except Exception as exc:
        logger.debug("Health check probe failed for %s:%s: %s", ip_address, port, exc)
        return False


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
                # Alert is already firing; skip duplicate DB row and Telegram notification.
                # (Alertmanager repeats webhooks on group updates or repeat_interval).
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
            # For InstanceDown alerts, verify the target is genuinely reachable via TCP.
            # When host sleeps or scrapes pause, Alertmanager's resolve_timeout (5m)
            # dispatches a false "resolved" status even though targets remain offline.
            if alert_name == "InstanceDown":
                try:
                    target_port = (
                        int(instance.split(":")[1])
                        if ":" in instance
                        else (target.port or 9100)
                    )
                except (ValueError, IndexError):
                    target_port = target.port or 9100

                reachable = await is_target_reachable(target.ip_address, target_port)
                if not reachable:
                    logger.warning(
                        "Rejecting false resolution for InstanceDown on %s (%s:%s): target is still unreachable",
                        target.name,
                        target.ip_address,
                        target_port,
                    )
                    continue

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
                if existing.status == "resolved":
                    # Already resolved, avoid duplicate processing
                    continue

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


async def get_prometheus_active_alerts(
    prometheus_url: str = settings.PROMETHEUS_URL,
) -> set[str]:
    """
    Query Prometheus /api/v1/alerts for instances currently in 'firing' state for 'InstanceDown'.

    Returns:
        Set of instance endpoints ('ip:port') currently firing in Prometheus.
    """
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{prometheus_url.rstrip('/')}/api/v1/alerts")
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                alerts_list = data.get("alerts", [])
                firing_instances: set[str] = set()
                for a in alerts_list:
                    if (
                        a.get("state") == "firing"
                        and a.get("labels", {}).get("alertname") == "InstanceDown"
                    ):
                        inst = a.get("labels", {}).get("instance")
                        if inst:
                            firing_instances.add(inst)
                return firing_instances
    except Exception as exc:
        logger.debug("Failed to query Prometheus active alerts: %s", exc)
    return set()


async def reconcile_stale_instance_down_alerts(
    db: AsyncSession,
    health_map: dict[str, dict] | None = None,
    active_alerts: set[str] | None = None,
) -> list[Alert]:
    """
    Reconcile orphaned firing 'InstanceDown' alerts with live Prometheus scrape health.

    When targets recover after a monitoring stack restart or host sleep cycle,
    Alertmanager's in-memory state does not retain pre-existing firing alerts,
    preventing resolved webhooks from firing. This function detects active targets
    confirmed healthy by Prometheus that are no longer firing in Prometheus rules,
    and transitions any orphaned database alert records to 'resolved'.

    Args:
        db: Active database session.
        health_map: Optional pre-fetched map of endpoint to scrape health metadata.
        active_alerts: Optional pre-fetched set of instances currently firing in Prometheus.

    Returns:
        List of Alert ORM objects that were reconciled and resolved.
    """
    if health_map is None:
        from app.services.target_service import get_prometheus_targets_health

        health_map = await get_prometheus_targets_health()

    if active_alerts is None:
        active_alerts = await get_prometheus_active_alerts()

    # Guard: if Prometheus is unreachable, do not perform speculative reconciliation
    if not health_map:
        return []

    result = await db.execute(select(Target).where(Target.is_active.is_(True)))
    targets = list(result.scalars().all())

    reconciled: list[Alert] = []
    to_dispatch = []
    now = datetime.now(timezone.utc)

    for target in targets:
        endpoint = f"{target.ip_address}:{target.port or 9100}"
        target_health = health_map.get(endpoint, {}).get("health")

        # Target must be reported UP by Prometheus, and NOT currently firing in Prometheus rules
        if target_health == "up" and endpoint not in active_alerts:
            firing_result = await db.execute(
                select(Alert).where(
                    Alert.target_id == target.id,
                    Alert.alert_name == "InstanceDown",
                    Alert.status == "firing",
                )
            )
            stale_alerts = list(firing_result.scalars().all())

            for alert_row in stale_alerts:
                alert_row.status = "resolved"
                alert_row.resolved_at = now
                reconciled.append(alert_row)

                logger.info(
                    "Auto-reconciled stale InstanceDown alert #%s for target %s (%s)",
                    alert_row.id,
                    target.name,
                    endpoint,
                )
                to_dispatch.append({
                    "alert_name": "InstanceDown",
                    "status": "resolved",
                    "instance": endpoint,
                    "severity": alert_row.severity,
                    "message": f"Target {target.name} recovered and is reporting healthy to Prometheus.",
                })

    if reconciled:
        await db.commit()
        for alert_row in reconciled:
            await db.refresh(alert_row)

        for dispatch_data in to_dispatch:
            await send_telegram_alert(**dispatch_data)

    return reconciled


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
    # Reconcile stale alerts before returning history to keep dashboard in sync with reality
    await reconcile_stale_instance_down_alerts(db)

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
