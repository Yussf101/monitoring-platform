"""
Prometheus HTTP Service Discovery endpoint.

Provides targets in the `http_sd_configs` JSON format.
Prometheus polls this endpoint to dynamically discover active targets.
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
                    "monitoring_name": target.name,
                    "monitoring_os": target.os_type,
                    "monitoring_env": target.environment,
                },
            }
        )

    return discovery_targets
