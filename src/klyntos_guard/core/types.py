"""Core type definitions for KlyntosGuard."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class RailType(str, Enum):
    """Types of guardrails available in the system."""

    INPUT = "input"
    OUTPUT = "output"
    DIALOG = "dialog"
    RETRIEVAL = "retrieval"
    EXECUTION = "execution"


class RailStatus(str, Enum):
    """Status of a guardrail check."""

    PASSED = "passed"
    BLOCKED = "blocked"
    WARNING = "warning"
    ERROR = "error"


class ProcessingContext(BaseModel):
    """Context information for processing requests."""

    user_id: Optional[str] = None
    session_id: Optional[str] = None
    tenant_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RailViolation(BaseModel):
    """Details about a guardrail violation."""

    rail_name: str
    rail_type: RailType
    severity: str  # low, medium, high, critical
    message: str
    details: Optional[Dict[str, Any]] = None
    suggestion: Optional[str] = None


class GuardrailResult(BaseModel):
    """Result of guardrail processing."""

    status: RailStatus
    allowed: bool
    original_input: str
    processed_output: Optional[str] = None
    violations: List[RailViolation] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    processing_time_ms: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LLMRequest(BaseModel):
    """Request to an LLM provider."""

    provider: str
    model: str
    messages: List[Dict[str, str]]
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    top_p: float = 1.0
    stream: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    """Response from an LLM provider."""

    provider: str
    model: str
    content: str
    usage: Dict[str, int]
    finish_reason: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RailConfig(BaseModel):
    """Configuration for a single guardrail."""

    name: str
    type: RailType
    enabled: bool = True
    priority: int = 100  # Lower number = higher priority
    config: Dict[str, Any] = Field(default_factory=dict)
    description: Optional[str] = None


class AuditLog(BaseModel):
    """Audit log entry for compliance tracking."""

    id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    session_id: Optional[str] = None
    rail_name: Optional[str] = None
    status: RailStatus
    input_text: str
    output_text: Optional[str] = None
    violations: List[RailViolation] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PluginMetadata(BaseModel):
    """Metadata for a guardrail plugin."""

    name: str
    version: str
    author: str
    description: str
    rail_types: List[RailType]
    dependencies: List[str] = Field(default_factory=list)
    config_schema: Dict[str, Any] = Field(default_factory=dict)
