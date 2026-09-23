from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MetricSnapshotBase(BaseModel):
    target_id: int
    instance: str
    cpu_usage_percent: float | None = None
    memory_usage_percent: float | None = None
    disk_usage_percent: float | None = None
    load_1m: float | None = None
    memory_total_bytes: float | None = None
    memory_available_bytes: float | None = None
    disk_total_bytes: float | None = None
    disk_free_bytes: float | None = None
    network_receive_rate: float | None = None
    network_transmit_rate: float | None = None


class MetricSnapshotCreate(MetricSnapshotBase):
    recorded_at: datetime | None = None


class MetricSnapshotResponse(MetricSnapshotBase):
    id: int
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MetricAggregation(BaseModel):
    target_id: int | None = None
    avg_cpu: float | None = None
    avg_memory: float | None = None
    avg_disk: float | None = None
    avg_load: float | None = None
    min_recorded_at: datetime | None = None
    max_recorded_at: datetime | None = None
    sample_count: int = 0
