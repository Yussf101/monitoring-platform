# Architecture

> **Platform**: Plateforme de Monitoring Multi-VMs pour le Suivi de Métriques Système en Temps Réel
> **Version**: 2.0 — Upgraded from [Monitoring-Stack-with-Grafana](https://github.com/Yussf101/Monitoring-Stack-with-Grafana)

## System Overview

```mermaid
graph TB
    subgraph External ["Target VMs (Ubuntu Server)"]
        NE1["Node Exporter :9100"]
        NE2["Node Exporter :9100"]
        NE3["Node Exporter :9100"]
    end

    subgraph Platform ["Docker Compose Stack"]
        FE["Frontend<br/>(React + Nginx :3000)"]
        BE["Backend<br/>(FastAPI :8000)"]
        DB[("PostgreSQL :5432")]
        PROM["Prometheus :9090"]
        AM["Alertmanager :9093"]
        GF["Grafana :3001"]
        KAFKA["Kafka :9092"]
        PROD["Metrics Producer"]
        CONS["Metrics Consumer"]
    end

    subgraph Notifications
        TG["Telegram Bot"]
    end

    subgraph Provisioning
        ANS["Ansible Container"]
    end

    FE -->|REST API| BE
    BE -->|CRUD| DB
    PROM -->|HTTP SD /api/discovery| BE
    PROM -->|Scrape :9100| NE1
    PROM -->|Scrape :9100| NE2
    PROM -->|Scrape :9100| NE3
    PROM -->|Alert Rules| AM
    AM -->|Webhook POST| BE
    BE -->|Notify| TG
    PROD -->|Query /api/v1/query| PROM
    PROD -->|Publish| KAFKA
    KAFKA -->|Consume| CONS
    CONS -->|Batch Insert| DB
    GF -->|Query| PROM
    ANS -->|SSH + Playbook| NE1
    ANS -->|SSH + Playbook| NE2
    ANS -->|SSH + Playbook| NE3
    ANS -->|Register Target| BE

    style FE fill:#3b82f6,stroke:#1e40af,color:#fff
    style BE fill:#10b981,stroke:#047857,color:#fff
    style DB fill:#f59e0b,stroke:#b45309,color:#fff
    style PROM fill:#ef4444,stroke:#b91c1c,color:#fff
    style AM fill:#f97316,stroke:#c2410c,color:#fff
    style GF fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style KAFKA fill:#06b6d4,stroke:#0e7490,color:#fff
    style PROD fill:#14b8a6,stroke:#0f766e,color:#fff
    style CONS fill:#14b8a6,stroke:#0f766e,color:#fff
    style TG fill:#0ea5e9,stroke:#0369a1,color:#fff
    style ANS fill:#ec4899,stroke:#be185d,color:#fff
```

## Component Reference

| Service | Technology | Container | Port | Responsibility |
|---|---|---|---|---|
| **Backend** | Python FastAPI | `monitoring-backend` | 8000 | REST API for target CRUD, Prometheus HTTP SD, alert webhook, and metrics queries |
| **Frontend** | React + Vite + Nginx | `monitoring-frontend` | 3000 | Admin dashboard for target management and alert history viewing |
| **Database** | PostgreSQL 15 | `monitoring-db` | 5432 | Persistent storage for targets, alerts, and metric snapshots |
| **Prometheus** | Prometheus v2.53.0 | `monitoring-prometheus` | 9090 | Metric scraping, alert rule evaluation, time-series storage (15d retention) |
| **Alertmanager** | Alertmanager v0.27.0 | `monitoring-alertmanager` | 9093 | Alert grouping, deduplication, and routing to webhook receiver |
| **Kafka** | Apache Kafka (KRaft) | `monitoring-kafka` | 9092 | Message broker for `server-metrics` topic |
| **Metrics Producer** | Python (kafka-python) | `monitoring-metrics-producer` | — | Polls Prometheus API every 60s, publishes metric snapshots to Kafka |
| **Metrics Consumer** | Python (kafka-python + psycopg2) | `monitoring-metrics-consumer` | — | Batch-consumes from Kafka, resolves target IDs, inserts into PostgreSQL |
| **Grafana** | Grafana (latest) | `monitoring-grafana` | 3001 | Interactive metric visualization dashboards sourced from Prometheus |
| **Ansible** | Ansible (on-demand) | `monitoring-ansible` | — | Provisions Node Exporter on target VMs and registers them via the API |

## Data Flow: Target Management

This sequence shows how a new VM target is registered and becomes automatically monitored.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Frontend
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL
    participant Prom as Prometheus

    User->>Frontend: Add target (name, IP, port)
    Frontend->>Backend: POST /api/targets
    Backend->>DB: INSERT INTO targets
    DB-->>Backend: Target record (id, is_active=true)
    Backend-->>Frontend: 201 Created + TargetRead

    Note over Prom: Every 30 seconds
    Prom->>Backend: GET /api/discovery
    Backend->>DB: SELECT * FROM targets WHERE is_active
    DB-->>Backend: Active targets list
    Backend-->>Prom: HTTP SD JSON response

    Prom->>Prom: Update scrape targets
    Prom->>NE: Scrape :9100/metrics

    Note over User: Target appears in Prometheus within 30s<br/>No restart required
```

## Data Flow: Alerting Pipeline

This sequence shows the end-to-end alert lifecycle from metric threshold violation to Telegram notification.

```mermaid
sequenceDiagram
    participant NE as Node Exporter
    participant Prom as Prometheus
    participant AM as Alertmanager
    participant Backend as FastAPI Backend
    participant DB as PostgreSQL
    participant TG as Telegram Bot
    participant User

    NE->>Prom: Metrics (CPU, Memory, Disk, Load)
    Prom->>Prom: Evaluate alert rules (e.g. CPU > 90%)

    alt Alert fires (threshold exceeded for 5m)
        Prom->>AM: Fire alert (alertname, severity, instance)
        AM->>AM: Group by alertname + instance, wait 30s
        AM->>Backend: POST /api/alerts/webhook (AlertmanagerPayload)
        Backend->>DB: Resolve target_id from instance label
        Backend->>DB: INSERT INTO alerts (target_id, alert_name, severity, status)
        Backend->>TG: Send notification (alert details + target info)
        TG-->>User: 🚨 Alert notification
    end

    alt Alert resolves
        Prom->>AM: Resolve alert
        AM->>Backend: POST /api/alerts/webhook (status=resolved)
        Backend->>DB: UPDATE alert SET status='resolved', resolved_at=now()
        Backend->>TG: Send resolution notification
        TG-->>User: ✅ Alert resolved
    end
```

## Data Flow: Metrics Pipeline (Kafka)

This sequence shows how system metrics flow from Prometheus through Kafka into PostgreSQL for historical storage.

```mermaid
sequenceDiagram
    participant Prom as Prometheus
    participant Producer as Metrics Producer
    participant Kafka as Kafka Broker
    participant Consumer as Metrics Consumer
    participant DB as PostgreSQL

    Note over Producer: Every 60 seconds (POLL_INTERVAL)

    Producer->>Prom: GET /api/v1/query (PromQL queries)
    Note right of Producer: Queries: cpu_usage, memory,<br/>disk, load, network I/O

    Prom-->>Producer: Query results per instance

    Producer->>Producer: Build MetricSnapshot per instance
    Producer->>Kafka: Publish to "server-metrics" topic

    Note over Consumer: Continuous consumption

    Kafka-->>Consumer: Batch of messages (BATCH_SIZE=50)
    Consumer->>DB: SELECT ip_address, port, id FROM targets
    Consumer->>Consumer: Map instance → target_id
    Consumer->>DB: execute_batch INSERT INTO metric_snapshots
    Note right of Consumer: Fields: target_id, instance,<br/>cpu, memory, disk, load,<br/>network rates, recorded_at
```

## Database Schema

```mermaid
erDiagram
    targets {
        int id PK
        string name
        string ip_address
        int port
        string os_type
        string environment
        string ssh_user
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    alerts {
        int id PK
        int target_id FK
        string alert_name
        string severity
        string status
        text message
        datetime fired_at
        datetime resolved_at
        datetime created_at
    }

    metric_snapshots {
        int id PK
        int target_id FK
        string instance
        float cpu_usage_percent
        float memory_usage_percent
        float disk_usage_percent
        float load_1m
        float memory_total_bytes
        float memory_available_bytes
        float disk_total_bytes
        float disk_free_bytes
        float network_receive_rate
        float network_transmit_rate
        datetime recorded_at
        datetime created_at
    }

    targets ||--o{ alerts : "triggers"
    targets ||--o{ metric_snapshots : "records"
```

## Directory Structure

```
monitoring-platform-v2/
├── backend/                    # FastAPI control plane
│   ├── app/
│   │   ├── core/               # Config, database, settings
│   │   ├── models/             # SQLAlchemy ORM models (Target, Alert, MetricSnapshot)
│   │   ├── routers/            # API endpoint handlers (targets, alerts, discovery, metrics)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app initialization
│   ├── alembic/                # Database migrations
│   ├── tests/                  # pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React admin dashboard
│   ├── src/
│   │   ├── components/         # UI components (Sidebar, TargetTable, AlertTable, etc.)
│   │   ├── pages/              # Page components (Dashboard, Targets, Alerts)
│   │   ├── lib/                # API client and utilities
│   │   └── App.tsx             # Root component with routing
│   ├── Dockerfile              # Multi-stage build → Nginx
│   └── nginx.conf              # Reverse proxy to backend API
├── pipeline/                   # Kafka data pipeline
│   ├── producer.py             # Polls Prometheus, publishes to Kafka
│   ├── consumer.py             # Consumes from Kafka, writes to PostgreSQL
│   └── Dockerfile
├── prometheus/                 # Prometheus configuration
│   ├── prometheus.yml          # Scrape config with http_sd_configs
│   └── alerts/                 # Alert rule definitions (node_alerts.yml)
├── alertmanager/               # Alertmanager configuration
│   └── alertmanager.yml        # Routes alerts to backend webhook
├── grafana/                    # Grafana configuration
│   ├── grafana.ini             # Server settings
│   └── provisioning/           # Auto-provisioned datasources and dashboards
├── ansible/                    # Infrastructure automation
│   ├── site.yml                # Main playbook
│   ├── roles/                  # Ansible roles (node_exporter, register_target)
│   ├── inventory/              # Host inventory files
│   └── Dockerfile              # Containerized Ansible runner
├── .github/workflows/          # CI/CD
│   └── ci.yml                  # Lint, test, build, push Docker images
├── docker-compose.yml          # Full stack orchestration (10 services)
└── .env                        # Environment variables (not committed)
```

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Service Discovery** | Prometheus HTTP SD (`http_sd_configs`) | Zero-downtime target management — no Prometheus restarts needed |
| **Message Broker** | Apache Kafka (KRaft mode) | Decouples metric collection from storage; enables replay and buffering |
| **Alert Delivery** | Alertmanager → Webhook → Telegram | Leverages Prometheus ecosystem; webhook allows persistence + custom routing |
| **Database** | PostgreSQL (async via asyncpg) | ACID compliance for target/alert state; async driver for non-blocking I/O |
| **Frontend Serving** | Nginx (production build) | Static asset serving + API reverse proxy in a single container |
| **IaC** | Containerized Ansible | Reproducible provisioning without installing Ansible on the host |
| **CI/CD** | GitHub Actions → GHCR | Native GitHub integration; free for public repos |
