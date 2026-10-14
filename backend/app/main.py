"""
FastAPI application entry point.

This file initializes the FastAPI instance and registers all application routers.
"""

import asyncio
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import async_session_factory
from app.routers import alerts, discovery, metrics, targets
from app.services.alert_service import reconcile_stale_instance_down_alerts

logger = logging.getLogger(__name__)


async def _alert_reconciliation_worker() -> None:
    """
    Background worker periodically reconciling orphaned alerts with live Prometheus health.
    """
    while True:
        try:
            await asyncio.sleep(30)
            async with async_session_factory() as db:
                await reconcile_stale_instance_down_alerts(db)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.debug("Background alert reconciliation tick error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(_alert_reconciliation_worker())
    try:
        yield
    finally:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.APP_NAME,
    description="REST API for managing monitored targets and Prometheus HTTP SD.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(targets.router)
app.include_router(discovery.router)
app.include_router(alerts.router)
app.include_router(metrics.router)


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME}
