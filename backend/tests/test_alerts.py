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
    """Insert a firing alert first, then POST a resolved webhook."""
    await create_target(async_client)

    # First send firing
    await async_client.post("/api/alerts/webhook", json=webhook_payload)

    # Then send resolved
    webhook_payload["status"] = "resolved"
    webhook_payload["alerts"][0]["status"] = "resolved"
    webhook_payload["alerts"][0]["endsAt"] = "2026-09-20T20:05:00Z"

    response = await async_client.post("/api/alerts/webhook", json=webhook_payload)

    assert response.status_code == 200
    assert response.json()["processed"] == 1

    get_response = await async_client.get("/api/alerts")
    alerts = get_response.json()

    assert len(alerts) == 1
    assert alerts[0]["status"] == "resolved"
    assert alerts[0]["resolved_at"] is not None


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
