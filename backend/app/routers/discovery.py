"""
Prometheus HTTP Service Discovery endpoint.

Prometheus supports `http_sd_configs` — instead of reading targets from a
static YAML file, it calls this endpoint periodically (every 30s by default)
and receives the current list of targets as JSON.

This is the core innovation over the 1A project: adding or removing a
target via the API automatically updates what Prometheus scrapes,
with zero restarts and zero file editing.

Expected output format for Prometheus:
[
    {
        "targets": ["192.168.1.50:9100"],
        "labels": {
            "__meta_name": "web-server-01",
            "__meta_os_type": "linux",
            "__meta_environment": "production"
        }
    },
    ...
]
"""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import target_service

router = APIRouter(tags=["Service Discovery"])


@router.get(
    "/api/discovery",
    summary="Prometheus HTTP SD targets",
    description=(
        "Returns all active targets in the Prometheus http_sd_configs JSON format. "
        "Configure Prometheus with `http_sd_configs` pointing to this endpoint."
    ),
)
async def get_discovery_targets(
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Build the Prometheus service discovery response.

    Each active target becomes one entry with:
    - targets: ["<ip>:<port>"] — what Prometheus will scrape.
    - labels: metadata attached to every metric from this target.
    """
    targets = await target_service.get_all_targets(db)

    discovery_targets = []
    for target in targets:
        # Only include targets that are currently active
        if not target.is_active:
            continue

        discovery_targets.append(
            {
                "targets": [f"{target.ip_address}:{target.port}"],
                "labels": {
                    "__meta_name": target.name,
                    "__meta_os_type": target.os_type,
                    "__meta_environment": target.environment,
                },
            }
        )

    return discovery_targets
