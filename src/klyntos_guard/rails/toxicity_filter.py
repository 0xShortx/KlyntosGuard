"""Toxicity filtering rail for LLM outputs."""

from typing import Any, Dict, Optional

try:
    from detoxify import Detoxify
    DETOXIFY_AVAILABLE = True
except ImportError:
    DETOXIFY_AVAILABLE = False

from klyntos_guard.core.types import ProcessingContext
from klyntos_guard.rails.base import BaseRail
from klyntos_guard.rails.registry import register_rail


@register_rail("toxicity_filter")
class ToxicityFilterRail(BaseRail):
    """
    Filter toxic or inappropriate LLM outputs.

    Specifically designed for output filtering to ensure AI responses
    are safe and appropriate before delivery to users.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize toxicity filter rail."""
        super().__init__(config)

        if not DETOXIFY_AVAILABLE:
            raise ImportError(
                "Detoxify is required for ToxicityFilterRail. "
                "Install it with: pip install detoxify"
            )

        # Initialize model
        model_type = self.config.get("model_type", "original")
        self.model = Detoxify(model_type)

        # Configuration
        self.threshold = self.config.get("threshold", 0.8)

        # Categories to check
        self.categories = self.config.get("categories", [
            "toxicity",
            "severe_toxicity",
            "obscene",
            "threat",
            "insult"
        ])

        # Per-category thresholds
        self.category_thresholds = self.config.get("category_thresholds", {
            "toxicity": self.threshold,
            "severe_toxicity": self.threshold * 0.6,  # Lower threshold for severe
            "obscene": self.threshold,
            "threat": self.threshold * 0.7,
            "insult": self.threshold,
            "identity_hate": self.threshold * 0.6,
        })

        # Action to take
        self.action = self.config.get("action", "block")  # block, sanitize, warn

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process LLM output for toxicity.

        Args:
            output_text: The LLM's output text
            context: Processing context

        Returns:
            Dictionary with filtering decision and details
        """
        # Run toxicity detection
        results = self.model.predict(output_text)

        # Check each configured category
        violations = []
        max_score = 0.0
        max_category = None

        for category in self.categories:
            if category not in results:
                continue

            score = results[category]
            threshold = self.category_thresholds.get(category, self.threshold)

            if score > threshold:
                violations.append({
                    "category": category,
                    "score": float(score),
                    "threshold": threshold
                })

            if score > max_score:
                max_score = score
                max_category = category

        # Take action if violations found
        if violations:
            if self.action == "block":
                return {
                    "blocked": True,
                    "severity": self._get_severity(max_score),
                    "message": f"Output blocked due to {max_category} (score: {max_score:.2f})",
                    "details": {
                        "violations": violations,
                        "max_score": max_score,
                        "max_category": max_category,
                        "all_scores": {k: float(v) for k, v in results.items()}
                    }
                }

            elif self.action == "sanitize":
                # In a real implementation, you might use a sanitization service
                sanitized_text = self._sanitize_output(output_text, violations)
                return {
                    "blocked": False,
                    "transformed_output": sanitized_text,
                    "warning": f"Output sanitized due to {max_category}",
                    "details": {
                        "violations": violations,
                        "original_text": output_text
                    }
                }

            elif self.action == "warn":
                return {
                    "blocked": False,
                    "warning": f"Potential toxicity detected: {max_category} (score: {max_score:.2f})",
                    "details": {
                        "violations": violations,
                        "all_scores": {k: float(v) for k, v in results.items()}
                    }
                }

        # No violations
        return {
            "blocked": False,
            "details": {
                "all_scores": {k: float(v) for k, v in results.items()}
            }
        }

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Can also be used to filter user inputs."""
        return await self.process_output(input_text, context)

    def _sanitize_output(
        self, text: str, violations: list
    ) -> str:
        """
        Attempt to sanitize toxic output.

        This is a placeholder - in production, you might:
        1. Use a text generation model to rephrase
        2. Use regex to remove offensive patterns
        3. Return a safe default response
        """
        # For now, return a safe default message
        return "I apologize, but I cannot provide that response. How else can I help you?"

    def _get_severity(self, score: float) -> str:
        """Determine severity level based on score."""
        if score >= 0.95:
            return "critical"
        elif score >= 0.9:
            return "high"
        elif score >= 0.8:
            return "medium"
        else:
            return "low"

    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about this rail."""
        return {
            "name": "toxicity_filter",
            "version": "1.0.0",
            "model_type": self.config.get("model_type", "original"),
            "threshold": self.threshold,
            "categories": self.categories,
            "action": self.action,
            "capabilities": ["input", "output"],
        }
