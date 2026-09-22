import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient

from app.models.metric_snapshot import MetricSnapshot
from app.models.target import Target

pytestmark = pytest.mark.asyncio


async def test_get_latest_metrics_empty(async_client: AsyncClient):
    response = await async_client.get("/api/metrics/latest")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_metric_history(async_client: AsyncClient, db_session):
    # Insert a target
    target = Target(name="history-test", ip_address="localhost", port=9090)
    db_session.add(target)
    await db_session.commit()
    await db_session.refresh(target)
    target_id = target.id

    # Insert 5 metric snapshots for this target
    now = datetime.now(timezone.utc)
    for i in range(5):
        snapshot = MetricSnapshot(
            target_id=target_id,
            instance=f"instance-{i}",
            cpu_usage_percent=10.0 + i,
            memory_usage_percent=20.0 + i,
            disk_usage_percent=30.0 + i,
            load_1m=1.0 + i * 0.1,
            recorded_at=now - timedelta(minutes=5 - i)
        )
        db_session.add(snapshot)
    await db_session.commit()

    # Query history
    response = await async_client.get(f"/api/metrics/history/{target_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    
    # Assert ordered by recorded_at DESC
    timestamps = [datetime.fromisoformat(item["recorded_at"].replace("Z", "+00:00")) for item in data]
    assert timestamps == sorted(timestamps, reverse=True)


async def test_get_metric_summary(async_client: AsyncClient, db_session):
    # Insert a target
    target = Target(name="summary-test", ip_address="localhost", port=9091)
    db_session.add(target)
    await db_session.commit()
    await db_session.refresh(target)
    target_id = target.id

    # Insert snapshots with known values for "instance-1"
    now = datetime.now(timezone.utc)
    snapshots = [
        MetricSnapshot(target_id=target_id, instance="instance-1", cpu_usage_percent=10.0, memory_usage_percent=50.0, disk_usage_percent=20.0, load_1m=1.0, recorded_at=now - timedelta(minutes=10)),
        MetricSnapshot(target_id=target_id, instance="instance-1", cpu_usage_percent=30.0, memory_usage_percent=60.0, disk_usage_percent=30.0, load_1m=3.0, recorded_at=now - timedelta(minutes=5)),
    ]
    db_session.add_all(snapshots)
    await db_session.commit()

    # Query summary
    response = await async_client.get(f"/api/metrics/summary?target_id={target_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    summary = data[0]
    assert summary["target_id"] == target_id
    assert summary["avg_cpu"] == 20.0
    assert summary["avg_memory"] == 55.0
    assert summary["avg_disk"] == 25.0
    assert summary["avg_load"] == 2.0
    assert summary["sample_count"] == 2


async def test_get_latest_metrics_per_target(async_client: AsyncClient, db_session):
    # Insert 2 targets
    t1 = Target(name="t1", ip_address="1.1.1.1", port=9090)
    t2 = Target(name="t2", ip_address="2.2.2.2", port=9090)
    db_session.add_all([t1, t2])
    await db_session.commit()
    await db_session.refresh(t1)
    await db_session.refresh(t2)
    t1_id = t1.id
    t2_id = t2.id

    # Insert snapshots for 2 targets
    now = datetime.now(timezone.utc)
    
    # t1 gets 2 snapshots, latest is now - 1 min
    db_session.add(MetricSnapshot(target_id=t1_id, instance="i1", cpu_usage_percent=1.0, recorded_at=now - timedelta(minutes=5)))
    db_session.add(MetricSnapshot(target_id=t1_id, instance="i1", cpu_usage_percent=2.0, recorded_at=now - timedelta(minutes=1)))
    
    # t2 gets 1 snapshot, latest is now - 2 min
    db_session.add(MetricSnapshot(target_id=t2_id, instance="i2", cpu_usage_percent=3.0, recorded_at=now - timedelta(minutes=2)))
    
    await db_session.commit()

    # Query latest metrics
    response = await async_client.get("/api/metrics/latest")
    assert response.status_code == 200
    data = response.json()
    
    # Should get 1 per target
    assert len(data) == 2
    t1_latest = next(d for d in data if d["target_id"] == t1_id)
    t2_latest = next(d for d in data if d["target_id"] == t2_id)
    
    assert t1_latest["cpu_usage_percent"] == 2.0
    assert t2_latest["cpu_usage_percent"] == 3.0
