"""
KlyntosGuard Guardrails System

AI safety guardrails for preventing vulnerable code generation.
Based on NVIDIA NeMo Guardrails architecture.
"""

from .engine import GuardrailsEngine
from .rails.base import Rail, RailResult, RailType

__version__ = "0.1.0"

__all__ = [
    "GuardrailsEngine",
    "Rail",
    "RailResult",
    "RailType",
]
