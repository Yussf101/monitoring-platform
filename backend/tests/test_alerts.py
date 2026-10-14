"""
Integration tests for the alerting pipeline.
"""

from unittest.mock import patch

import pytest
from app.main import app
from fastapi.testclient import TestClient
from httpx import AsyncClient


async def create_target(ac: AsyncClient):
    """Helper to create a test target via the API."""
    target_data = {
        "name": "Test Target",
        "ip_address": "192.168.1.100",
        "port": 9100,
        "os_type": "linux",
        "environment": "prod",
        "ssh_user": "test",
        "is_active": True,
    }
    response = await ac.post("/api/targets", json=target_data)
    return response.json()


@pytest.fixture
def webhook_payload():
    return {
        "version": "4",
        "status": "firing",
        "receiver": "backend-webhook",
        "alerts": [
            {
                "status": "firing",
                "labels": {
                    "alertname": "InstanceDown",
                    "instance": "192.168.1.100:9100",
                    "severity": "critical",
                    "job": "node_exporter",
                },
                "annotations": {
                    "summary": "Instance down",
                    "description": "Node exporter is unreachable",
                },
                "startsAt": "2026-09-20T20:00:00Z",
                "endsAt": "0001-01-01T00:00:00Z",
                "fingerprint": "abc123",
            }
        ],
        "groupLabels": {"alertname": "InstanceDown"},
        "commonLabels": {"alertname": "InstanceDown"},
        "commonAnnotations": {"summary": "Instance down"},
        "externalURL": "http://alertmanager:9093",
    }


@pytest.mark.asyncio
async def test_webhook_firing_alert_persists(
    webhook_payload, async_client: AsyncClient
):
    """POST a firing webhook payload with a known target in DB."""
    target = await create_target(async_client)

    response = await async_client.post("/api/alerts/webhook", json=webhook_payload)

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["processed"] == 1

    get_response = await async_client.get("/api/alerts")
    alerts = get_response.json()

    assert len(alerts) == 1
    assert alerts[0]["alert_name"] == "InstanceDown"
    assert alerts[0]["severity"] == "critical"
    assert alerts[0]["status"] == "firing"
    assert alerts[0]["target_id"] == target["id"]


@pytest.mark.asyncio
async def test_webhook_resolved_updates_alert(
    webhook_payload, async_client: AsyncClient
):
    """Insert a firing alert first, then POST a genuine resolved webhook when target is verified reachable."""
    await create_target(async_client)

    # First send firing
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    # Then send resolved with target verified reachable
    webhook_payload["status"] = "resolved"
    webhook_payload["alerts"][0]["status"] = "resolved"
    webhook_payload["alerts"][0]["endsAt"] = "2026-09-20T20:05:00Z"

    with patch("app.services.alert_service.is_target_reachable", return_value=True):
        response = await async_client.post("/api/alerts/webhook", json=webhook_payload)

    assert response.status_code == 200
    assert response.json()["processed"] == 1

    get_response = await async_client.get("/api/alerts")
    alerts = get_response.json()

    assert len(alerts) == 1
    assert alerts[0]["status"] == "resolved"
    assert alerts[0]["resolved_at"] is not None


@pytest.mark.asyncio
async def test_webhook_resolved_rejected_when_target_still_unreachable(
    webhook_payload, async_client: AsyncClient
):
    """When target is still unreachable, reject false resolution and keep alert firing."""
    await create_target(async_client)

    # First send firing
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    # Alertmanager sends resolved (e.g. after sleep timeout), but target is still down
    webhook_payload["status"] = "resolved"
    webhook_payload["alerts"][0]["status"] = "resolved"
    webhook_payload["alerts"][0]["endsAt"] = "2026-09-20T20:05:00Z"

    with patch("app.services.alert_service.is_target_reachable", return_value=False), \
         patch("app.services.alert_service.send_telegram_alert") as mock_tg:
        response = await async_client.post("/api/alerts/webhook", json=webhook_payload)

    assert response.status_code == 200
    assert response.json()["processed"] == 0

    get_response = await async_client.get("/api/alerts")
    alerts = get_response.json()

    assert len(alerts) == 1
    # Alert must remain firing and not falsely resolved
    assert alerts[0]["status"] == "firing"
    assert alerts[0]["resolved_at"] is None
    # No false resolution notification sent to Telegram
    mock_tg.assert_not_called()


@pytest.mark.asyncio
async def test_webhook_unknown_target_skips(webhook_payload, async_client: AsyncClient):
    """POST a webhook with an instance IP that has no matching target."""
    webhook_payload["alerts"][0]["labels"]["instance"] = "10.0.0.99:9100"

    response = await async_client.post("/api/alerts/webhook", json=webhook_payload)

    assert response.status_code == 200
    assert response.json()["processed"] == 0

    get_response = await async_client.get("/api/alerts")
    alerts = get_response.json()

    assert len(alerts) == 0


@pytest.mark.asyncio
async def test_get_alerts_pagination(webhook_payload, async_client: AsyncClient):
    """Insert 3 alerts, test limit and offset."""
    await create_target(async_client)

    # Send 3 different alerts
    for i in range(3):
        payload = webhook_payload.copy()
        payload["alerts"] = [webhook_payload["alerts"][0].copy()]
        payload["alerts"][0]["labels"]["alertname"] = f"Alert-{i}"
        await async_client.post("/api/alerts/webhook", json=payload)

    resp_limit_2 = await async_client.get("/api/alerts?limit=2&offset=0")
    assert len(resp_limit_2.json()) == 2

    resp_offset_2 = await async_client.get("/api/alerts?limit=2&offset=2")
    assert len(resp_offset_2.json()) == 1


@pytest.mark.asyncio
async def test_get_alerts_by_target(webhook_payload, async_client: AsyncClient):
    """Insert alerts for 2 different targets, filter by target_id."""
    target1 = await create_target(async_client)

    target_data = {
        "name": "Target 2",
        "ip_address": "192.168.1.101",
        "port": 9100,
        "os_type": "linux",
        "environment": "prod",
        "ssh_user": "test",
        "is_active": True,
    }
    await async_client.post("/api/targets", json=target_data)

    # Alert for target 1
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    # Alert for target 2
    payload2 = webhook_payload.copy()
    payload2["alerts"] = [webhook_payload["alerts"][0].copy()]
    payload2["alerts"][0]["labels"]["instance"] = "192.168.1.101:9100"
    await async_client.post("/api/alerts/webhook", json=payload2)

    response = await async_client.get(f"/api/alerts/target/{target1['id']}")
    alerts = response.json()

    assert len(alerts) == 1
    assert alerts[0]["target_id"] == target1["id"]





@pytest.mark.asyncio
async def test_telegram_not_called_when_unconfigured(
    webhook_payload, async_client: AsyncClient
):
    """Ensure no crash when TELEGRAM_BOT_TOKEN is empty (default)."""
    await create_target(async_client)

    # We patch the settings so they are empty for this test
    with patch("app.services.telegram_service.settings.TELEGRAM_BOT_TOKEN", ""), \
         patch("app.services.telegram_service.settings.TELEGRAM_CHAT_ID", ""), \
         patch("app.services.telegram_service.httpx.AsyncClient.post") as mock_post:
        with TestClient(app) as client:
            response = client.post("/api/alerts/webhook", json=webhook_payload)

    assert response.status_code == 200
    assert response.json()["processed"] == 1
    mock_post.assert_not_called()


@pytest.mark.asyncio
async def test_reconcile_stale_instance_down_resolves_orphaned_alert(
    webhook_payload, db_session, async_client: AsyncClient
):
    """Orphaned firing InstanceDown alert is auto-resolved when target is up and not firing in Prometheus."""
    from app.services.alert_service import reconcile_stale_instance_down_alerts

    target = await create_target(async_client)
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    # Health map shows target is up, Prometheus has no active InstanceDown alert
    health_map = {f"{target['ip_address']}:{target['port']}": {"health": "up"}}
    active_alerts = set()

    with patch("app.services.alert_service.send_telegram_alert") as mock_tg:
        reconciled = await reconcile_stale_instance_down_alerts(
            db_session, health_map=health_map, active_alerts=active_alerts
        )

    assert len(reconciled) == 1
    assert reconciled[0].status == "resolved"
    assert reconciled[0].resolved_at is not None

    mock_tg.assert_called_once()
    assert mock_tg.call_args.kwargs["status"] == "resolved"
    assert mock_tg.call_args.kwargs["alert_name"] == "InstanceDown"


@pytest.mark.asyncio
async def test_reconcile_stale_alerts_skipped_when_target_down(
    webhook_payload, db_session, async_client: AsyncClient
):
    """Target that is still down in Prometheus must not have its alert resolved."""
    from app.services.alert_service import reconcile_stale_instance_down_alerts

    target = await create_target(async_client)
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    health_map = {f"{target['ip_address']}:{target['port']}": {"health": "down"}}
    active_alerts = set()

    reconciled = await reconcile_stale_instance_down_alerts(
        db_session, health_map=health_map, active_alerts=active_alerts
    )
    assert len(reconciled) == 0


@pytest.mark.asyncio
async def test_reconcile_stale_alerts_skipped_when_prometheus_still_firing(
    webhook_payload, db_session, async_client: AsyncClient
):
    """When Prometheus is still firing (e.g. keep_firing_for active), reconciliation must wait."""
    from app.services.alert_service import reconcile_stale_instance_down_alerts

    target = await create_target(async_client)
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    endpoint = f"{target['ip_address']}:{target['port']}"
    health_map = {endpoint: {"health": "up"}}
    active_alerts = {endpoint}

    reconciled = await reconcile_stale_instance_down_alerts(
        db_session, health_map=health_map, active_alerts=active_alerts
    )
    assert len(reconciled) == 0

