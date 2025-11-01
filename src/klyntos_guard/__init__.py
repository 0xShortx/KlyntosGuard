"""
KlyntosGuard - Programmable AI Safety Guardrails and Compliance Platform

An open-source framework for adding safety guardrails and compliance controls
to AI-powered conversational and workflow applications.
"""

__version__ = "0.1.0"
__author__ = "Klyntos Team"
__license__ = "MIT"

from klyntos_guard.core.engine import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig
from klyntos_guard.core.types import (
    GuardrailResult,
    RailType,
    ProcessingContext,
)

__all__ = [
    "GuardrailsEngine",
    "GuardrailsConfig",
    "GuardrailResult",
    "RailType",
    "ProcessingContext",
]
