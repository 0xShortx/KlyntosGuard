"""Guardrails API schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GuardrailsRequest(BaseModel):
    """Request to process input through guardrails."""

    input: str = Field(..., description="User input to process")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Processing context (user_id, session_id, etc.)"
    )
    config_override: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional configuration overrides"
    )
    stream: bool = Field(
        default=False,
        description="Enable streaming response"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "input": "What's the weather like today?",
                "context": {
                    "user_id": "user123",
                    "session_id": "session456"
                },
                "stream": False
            }
        }


class ViolationDetail(BaseModel):
    """Details about a guardrail violation."""

    rail_name: str
    rail_type: str
    severity: str
    message: str
    details: Optional[Dict[str, Any]] = None
    suggestion: Optional[str] = None


class GuardrailsResponse(BaseModel):
    """Response from guardrails processing."""

    status: str = Field(..., description="Processing status")
    allowed: bool = Field(..., description="Whether input was allowed")
    original_input: str = Field(..., description="Original user input")
    processed_output: Optional[str] = Field(
        default=None,
        description="Processed output from LLM"
    )
    violations: List[ViolationDetail] = Field(
        default_factory=list,
        description="List of violations found"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="List of warnings"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata"
    )
    processing_time_ms: Optional[float] = Field(
        default=None,
        description="Processing time in milliseconds"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Response timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "passed",
                "allowed": True,
                "original_input": "What's the weather like?",
                "processed_output": "I don't have access to real-time weather data...",
                "violations": [],
                "warnings": [],
                "metadata": {},
                "processing_time_ms": 125.5,
                "timestamp": "2025-01-01T12:00:00Z"
            }
        }
