# API Reference

The Monitoring Platform backend exposes a REST API powered by FastAPI.
This document details the main endpoints.

**Base URL**: `http://localhost:8000`

FastAPI also provides interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Targets API

Manage the servers/VMs being monitored.

### `GET /api/targets`
List all targets.

**Response** (`200 OK`): Array of Target objects.
```json
[
  {
    "id": 1,
    "name": "web-server-01",
    "ip_address": "192.168.1.50",
    "port": 9100,
    "os_type": "linux",
    "environment": "production",
    "ssh_user": "youssef",
    "is_active": true,
    "created_at": "2026-10-01T12:00:00Z",
    "updated_at": "2026-10-01T12:00:00Z"
  }
]
```

### `GET /api/targets/{id}`
Get a specific target by ID.

**Response** (`200 OK`): Single Target object.

### `POST /api/targets`
Register a new target.

**Request Body**:
```json
{
  "name": "web-server-01",
  "ip_address": "192.168.1.50",
  "port": 9100,
  "os_type": "linux",
  "environment": "production",
  "ssh_user": "youssef",
  "is_active": true
}
```

**Response** (`201 Created`): The created Target object.

### `PATCH /api/targets/{id}`
Update a target partially.

**Request Body**: Any subset of Target fields.
```json
{
  "is_active": false
}
```

**Response** (`200 OK`): The updated Target object.

### `DELETE /api/targets/{id}`
Remove a target and its associated alert history.

**Response** (`204 No Content`)

---

## Discovery API

### `GET /api/discovery`
Prometheus HTTP SD endpoint. Prometheus polls this to dynamically discover active targets.

**Response** (`200 OK`): Array of Prometheus discovery objects.
```json
[
  {
    "targets": ["192.168.1.50:9100"],
    "labels": {
      "monitoring_name": "web-server-01",
      "monitoring_os": "linux",
      "monitoring_env": "production"
    }
  }
]
```

---

## Alerts API

### `GET /api/alerts`
List alert history, paginated and most recent first.

**Query Parameters**:
- `limit` (int): default 50
- `offset` (int): default 0

**Response** (`200 OK`): Array of Alert objects.
```json
[
  {
    "id": 100,
    "target_id": 1,
    "alert_name": "HighCpuUsage",
    "severity": "critical",
    "status": "firing",
    "message": "CPU usage is > 90%",
    "fired_at": "2026-10-05T07:00:00Z",
    "resolved_at": null,
    "created_at": "2026-10-05T07:00:05Z"
  }
]
```

### `GET /api/alerts/target/{target_id}`
List all alerts associated with a specific target.

### `POST /api/alerts/webhook`
Alertmanager webhook receiver. Receives notifications from Alertmanager and persists them.

**Response** (`200 OK`):
```json
{
  "status": "ok",
  "processed": 1
}
```

---

## Metrics API

### `GET /api/metrics/latest`
Retrieve the most recent metric snapshot for each target.

**Query Parameters**:
- `target_id` (int, optional)

**Response** (`200 OK`):
```json
[
  {
    "id": 500,
    "target_id": 1,
    "instance": "192.168.1.50:9100",
    "cpu_usage_percent": 45.2,
    "memory_usage_percent": 60.1,
    "disk_usage_percent": 30.5,
    "load_1m": 1.2,
    "recorded_at": "2026-10-05T07:05:00Z"
  }
]
```

### `GET /api/metrics/history/{target_id}`
Retrieve historical metric snapshots for a specific target.

**Query Parameters**:
- `hours` (int): default 24
- `limit` (int): default 500

### `GET /api/metrics/summary`
Retrieve aggregated statistics (averages) per target over a given time window.

**Query Parameters**:
- `target_id` (int, optional)
- `hours` (int): default 1

**Response** (`200 OK`):
```json
[
  {
    "target_id": 1,
    "avg_cpu": 42.5,
    "avg_memory": 58.0,
    "avg_disk": 30.5,
    "avg_load": 1.1,
    "sample_count": 60,
    "min_recorded_at": "2026-10-05T06:00:00Z",
    "max_recorded_at": "2026-10-05T07:00:00Z"
  }
]
```
