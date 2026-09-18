"""
FastAPI application entry point.

This is the file that uvicorn runs: `uvicorn app.main:app`
It creates the FastAPI instance and registers all routers.

Architecture parallel (Java/Spring):
    This file ≈ your @SpringBootApplication main class that wires
    everything together via component scanning.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import discovery, targets

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "REST API for managing monitored targets and providing "
        "Prometheus HTTP service discovery."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow the Next.js frontend (Phase 6) to call this API
# from a different port without being blocked by the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (like Spring's @ComponentScan picking up @RestControllers)
app.include_router(targets.router)
app.include_router(discovery.router)


@app.get("/", tags=["Health"])
async def health_check():
    """Simple health check to verify the API is running."""
    return {"status": "healthy", "service": settings.APP_NAME}
