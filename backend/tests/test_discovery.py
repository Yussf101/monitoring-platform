import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_discovery_empty_db(async_client: AsyncClient):
    response = await async_client.get("/api/discovery")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_discovery_returns_active_targets(async_client: AsyncClient):
    # Insert targets via the API
    target1 = {
        "name": "target1",
        "ip_address": "192.168.1.100",
        "port": 9100,
        "os_type": "linux",
        "environment": "prod",
        "ssh_user": "user1",
        "is_active": True
    }
    target2 = {
        "name": "target2",
        "ip_address": "192.168.1.101",
        "port": 9100,
        "os_type": "windows",
        "environment": "staging",
        "ssh_user": "user2",
        "is_active": True
    }

    await async_client.post("/api/targets", json=target1)
    await async_client.post("/api/targets", json=target2)

    response = await async_client.get("/api/discovery")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Check structure
    assert data[0]["targets"] == ["192.168.1.100:9100"]
    assert data[0]["labels"]["monitoring_name"] == "target1"
    assert data[0]["labels"]["monitoring_os"] == "linux"
    assert data[0]["labels"]["monitoring_env"] == "prod"

    assert data[1]["targets"] == ["192.168.1.101:9100"]
    assert data[1]["labels"]["monitoring_name"] == "target2"


@pytest.mark.asyncio
async def test_discovery_excludes_inactive_targets(async_client: AsyncClient):
    # Insert 1 active + 1 inactive target
    active_target = {
        "name": "active",
        "ip_address": "192.168.1.100",
        "port": 9100,
        "os_type": "linux",
        "environment": "prod",
        "ssh_user": "user1",
        "is_active": True
    }
    inactive_target = {
        "name": "inactive",
        "ip_address": "192.168.1.101",
        "port": 9100,
        "os_type": "linux",
        "environment": "staging",
        "ssh_user": "user2",
        "is_active": False
    }

    await async_client.post("/api/targets", json=active_target)
    await async_client.post("/api/targets", json=inactive_target)

    response = await async_client.get("/api/discovery")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["labels"]["monitoring_name"] == "active"


@pytest.mark.asyncio
async def test_discovery_label_format(async_client: AsyncClient):
    target1 = {
        "name": "target1",
        "ip_address": "192.168.1.100",
        "port": 9100,
        "os_type": "linux",
        "environment": "prod",
        "ssh_user": "user1",
        "is_active": True
    }
    await async_client.post("/api/targets", json=target1)

    response = await async_client.get("/api/discovery")
    assert response.status_code == 200
    data = response.json()

    labels = data[0]["labels"]
    for key in labels.keys():
        assert not key.startswith("__meta_")
