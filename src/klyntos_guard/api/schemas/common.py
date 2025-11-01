"""Common API schemas."""

from typing import Any, Dict, Optional
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    message: str
    details: Optional[Dict[str, Any]] = None


class SuccessResponse(BaseModel):
    """Standard success response."""

    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
