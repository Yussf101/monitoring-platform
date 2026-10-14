"""
Tests for targets API endpoints and live Prometheus health integration.
"""

from unittest.mock import patch
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_targets_with_prometheus_health(async_client: AsyncClient):
    """Active target with UP status in Prometheus should have health='up'."""
    payload = {
        "name": "node-01",
        "ip_address": "192.168.1.50",
        "port": 9100,
        "os_type": "linux",
        "environment": "production",
        "ssh_user": "youssef",
        "is_active": True,
    }
    create_res = await async_client.post("/api/targets", json=payload)
    assert create_res.status_code == 201

    mock_health = {
        "192.168.1.50:9100": {
            "health": "up",
            "last_error": None,
            "last_scrape": "2026-10-13T23:00:00Z",
        }
    }

    with patch(
        "app.services.target_service.get_prometheus_targets_health",
        return_value=mock_health,
    ):
        res = await async_client.get("/api/targets")
        assert res.status_code == 200
        targets = res.json()
        assert len(targets) == 1
        assert targets[0]["health"] == "up"
        assert targets[0]["last_error"] is None
        assert targets[0]["last_scrape"] == "2026-10-13T23:00:00Z"


@pytest.mark.asyncio
async def test_list_targets_when_down_in_prometheus(async_client: AsyncClient):
    """Active target that Prometheus cannot scrape should report health='down' and last_error."""
    payload = {
        "name": "node-02",
        "ip_address": "192.168.1.51",
        "port": 9100,
        "os_type": "linux",
        "environment": "production",
        "ssh_user": "youssef",
        "is_active": True,
    }
    await async_client.post("/api/targets", json=payload)

    mock_health = {
        "192.168.1.51:9100": {
            "health": "down",
            "last_error": "context deadline exceeded",
            "last_scrape": "2026-10-13T23:05:00Z",
        }
    }

    with patch(
        "app.services.target_service.get_prometheus_targets_health",
        return_value=mock_health,
    ):
        res = await async_client.get("/api/targets")
        assert res.status_code == 200
        targets = res.json()
        assert len(targets) == 1
        assert targets[0]["health"] == "down"
        assert targets[0]["last_error"] == "context deadline exceeded"


@pytest.mark.asyncio
async def test_list_targets_muted_when_inactive(async_client: AsyncClient):
    """Target with is_active=False should report health='muted' regardless of Prometheus."""
    payload = {
        "name": "muted-node",
        "ip_address": "192.168.1.52",
        "port": 9100,
        "os_type": "linux",
        "environment": "production",
        "ssh_user": "youssef",
        "is_active": False,
    }
    await async_client.post("/api/targets", json=payload)

    res = await async_client.get("/api/targets")
    assert res.status_code == 200
    targets = res.json()
    assert len(targets) == 1
    assert targets[0]["health"] == "muted"


@pytest.mark.asyncio
async def test_get_target_by_id_includes_health(async_client: AsyncClient):
    """GET /api/targets/{id} should also include live health."""
    payload = {
        "name": "node-single",
        "ip_address": "192.168.1.53",
        "port": 9100,
        "os_type": "linux",
        "environment": "production",
        "ssh_user": "youssef",
        "is_active": True,
    }
    create_res = await async_client.post("/api/targets", json=payload)
    target_id = create_res.json()["id"]

    mock_health = {
        "192.168.1.53:9100": {
            "health": "up",
            "last_error": None,
            "last_scrape": "2026-10-13T23:00:00Z",
        }
    }

    with patch(
        "app.services.target_service.get_prometheus_targets_health",
        return_value=mock_health,
    ):
        res = await async_client.get(f"/api/targets/{target_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["health"] == "up"
