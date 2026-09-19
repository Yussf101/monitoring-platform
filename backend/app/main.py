"""
FastAPI application entry point.

This file initializes the FastAPI instance and registers all application routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import discovery, targets

app = FastAPI(
    title=settings.APP_NAME,
    description="REST API for managing monitored targets and Prometheus HTTP SD.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME}
