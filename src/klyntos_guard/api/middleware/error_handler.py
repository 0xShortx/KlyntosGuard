"""Error handling middleware."""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to handle errors globally."""

    async def dispatch(self, request: Request, call_next):
        """
        Handle request and catch errors.

        Args:
            request: HTTP request
            call_next: Next middleware/route handler

        Returns:
            HTTP response
        """
        try:
            response = await call_next(request)
            return response

        except Exception as e:
            logger.error(
                "unhandled_error",
                error=str(e),
                path=request.url.path,
                method=request.method,
                exc_info=True,
            )

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred",
                    "details": str(e) if logger.isEnabledFor("DEBUG") else None,
                },
            )
