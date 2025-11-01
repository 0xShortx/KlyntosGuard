"""Main FastAPI application for KlyntosGuard."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog

from klyntos_guard.core.config import settings
from klyntos_guard.api.routes import (
    guardrails,
    auth,
    subscriptions,
    webhooks,
    health,
    audit,
)
from klyntos_guard.api.middleware.error_handler import ErrorHandlerMiddleware

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the application."""
    # Startup
    logger.info(
        "klyntos_guard_starting",
        version="0.1.0",
        environment=settings.app_env,
    )

    # Initialize database connection pool, etc.
    # await init_db()

    yield

    # Shutdown
    logger.info("klyntos_guard_shutting_down")
    # Close database connections, etc.
    # await close_db()


# Create FastAPI application
app = FastAPI(
    title="KlyntosGuard API",
    description="Programmable AI Safety Guardrails and Compliance Platform",
    version="0.1.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add custom error handler middleware
app.add_middleware(ErrorHandlerMiddleware)

# Include routers
app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["Health"],
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

app.include_router(
    guardrails.router,
    prefix="/api/v1/guardrails",
    tags=["Guardrails"],
)

app.include_router(
    subscriptions.router,
    prefix="/api/v1/subscriptions",
    tags=["Subscriptions"],
)

app.include_router(
    audit.router,
    prefix="/api/v1/audit",
    tags=["Audit Logs"],
)

app.include_router(
    webhooks.router,
    prefix="/api/v1/webhooks",
    tags=["Webhooks"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "KlyntosGuard API",
        "version": "0.1.0",
        "status": "running",
        "docs": f"{settings.app_domain}/docs" if settings.app_debug else None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "klyntos_guard.api.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_debug,
        log_level=settings.log_level.lower(),
    )
