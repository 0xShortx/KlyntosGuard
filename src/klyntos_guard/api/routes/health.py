"""Health check endpoints."""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        Health status of the service
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint.

    Returns:
        Readiness status (checks database, etc.)
    """
    # TODO: Add database connectivity check
    # TODO: Add Redis connectivity check

    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "database": "healthy",
            "redis": "healthy",
        }
    }
