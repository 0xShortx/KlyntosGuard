"""
Base Rail Class and Core Types

This module defines the abstract base class for all guardrails and core types.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from datetime import datetime


class RailType(str, Enum):
    """Types of rails in the guardrails system"""
    INPUT = "input"           # Validates/transforms input prompts
    OUTPUT = "output"         # Validates/transforms LLM outputs
    DIALOG = "dialog"         # Guides conversation flow
    RETRIEVAL = "retrieval"   # Filters retrieved content (RAG)
    EXECUTION = "execution"   # Validates code/tool execution


class Severity(str, Enum):
    """Severity levels for rail violations"""
    CRITICAL = "critical"  # Must block
    HIGH = "high"          # Should block
    MEDIUM = "medium"      # Warn but allow
    LOW = "low"            # Log only
    INFO = "info"          # Informational


@dataclass
class RailContext:
    """
    Context passed through the guardrails pipeline.
    Contains all information needed for rail execution.
    """
    # Core request data
    prompt: str
    language: Optional[str] = None
    framework: Optional[str] = None

    # User/session context
    user_id: Optional[str] = None
    session_id: Optional[str] = None

    # Project context
    project_name: Optional[str] = None
    file_path: Optional[str] = None

    # Conversation history
    conversation_history: List[Dict[str, str]] = field(default_factory=list)

    # Generated output (for output rails)
    generated_code: Optional[str] = None

    # Retrieved content (for retrieval rails)
    retrieved_chunks: List[Dict[str, Any]] = field(default_factory=list)

    # Execution context (for execution rails)
    execution_plan: Optional[Dict[str, Any]] = None

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)

    def add_to_history(self, role: str, content: str):
        """Add message to conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })


@dataclass
class RailResult:
    """
    Result returned by a rail after processing.
    """
    # Whether the content is allowed to proceed
    allowed: bool

    # Modified content (if rail transformed it)
    modified_content: Optional[str] = None

    # Reason for blocking/modification
    reason: Optional[str] = None

    # Severity of any violation detected
    severity: Optional[Severity] = None

    # Specific issues detected
    issues: List[Dict[str, Any]] = field(default_factory=list)

    # Suggested alternatives or fixes
    suggestions: List[str] = field(default_factory=list)

    # Educational message for the user
    educational_message: Optional[str] = None

    # Metadata about rail execution
    rail_name: Optional[str] = None
    rail_type: Optional[RailType] = None
    execution_time_ms: Optional[float] = None

    # Additional data
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def content(self) -> Optional[str]:
        """Get the content (modified or original)"""
        return self.modified_content

    def block(self, reason: str, severity: Severity = Severity.HIGH, suggestions: List[str] = None):
        """Helper to create a blocking result"""
        self.allowed = False
        self.reason = reason
        self.severity = severity
        if suggestions:
            self.suggestions = suggestions
        return self

    def allow(self, modified_content: Optional[str] = None):
        """Helper to create an allowing result"""
        self.allowed = True
        if modified_content:
            self.modified_content = modified_content
        return self

    def add_issue(self, issue_type: str, message: str, **kwargs):
        """Add an issue to the result"""
        self.issues.append({
            "type": issue_type,
            "message": message,
            **kwargs
        })
        return self


class Rail(ABC):
    """
    Abstract base class for all guardrails.

    All rails must implement:
    - validate(): Process input and return RailResult
    - name property: Unique identifier for the rail
    - rail_type property: Type of rail (input, output, etc.)
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the rail with optional configuration.

        Args:
            config: Configuration dictionary for this rail
        """
        self.config = config or {}
        self.enabled = self.config.get('enabled', True)
        self.severity = Severity(self.config.get('severity', 'high'))
        self._setup()

    def _setup(self):
        """
        Optional setup method for rail-specific initialization.
        Override this in subclasses if needed.
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique name for this rail"""
        pass

    @property
    @abstractmethod
    def rail_type(self) -> RailType:
        """Type of rail"""
        pass

    @property
    def description(self) -> str:
        """Human-readable description of what this rail does"""
        return f"{self.name} rail"

    @abstractmethod
    async def validate(self, context: RailContext) -> RailResult:
        """
        Main validation logic for the rail.

        Args:
            context: The rail context containing all necessary information

        Returns:
            RailResult indicating whether to allow, block, or modify content
        """
        pass

    def should_run(self, context: RailContext) -> bool:
        """
        Determine if this rail should run for the given context.
        Override in subclasses for conditional execution.

        Args:
            context: The rail context

        Returns:
            True if rail should run, False otherwise
        """
        return self.enabled

    async def execute(self, context: RailContext) -> RailResult:
        """
        Execute the rail with timing and metadata.

        Args:
            context: The rail context

        Returns:
            RailResult with execution metadata
        """
        if not self.should_run(context):
            return RailResult(
                allowed=True,
                rail_name=self.name,
                rail_type=self.rail_type,
                metadata={"skipped": True, "reason": "Rail disabled or not applicable"}
            )

        start_time = datetime.now()

        try:
            result = await self.validate(context)

            # Add metadata
            result.rail_name = self.name
            result.rail_type = self.rail_type
            result.execution_time_ms = (datetime.now() - start_time).total_seconds() * 1000

            return result

        except Exception as e:
            # Rail execution failed - log but don't block
            return RailResult(
                allowed=True,  # Fail open for safety
                rail_name=self.name,
                rail_type=self.rail_type,
                metadata={
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}', type={self.rail_type.value}, enabled={self.enabled})>"
