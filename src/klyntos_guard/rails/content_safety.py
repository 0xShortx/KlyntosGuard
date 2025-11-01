"""Content safety rail using Detoxify for toxicity detection."""

from typing import Any, Dict, List, Optional

try:
    from detoxify import Detoxify
    DETOXIFY_AVAILABLE = True
except ImportError:
    DETOXIFY_AVAILABLE = False

from klyntos_guard.core.types import ProcessingContext
from klyntos_guard.rails.base import BaseRail
from klyntos_guard.rails.registry import register_rail


@register_rail("content_safety")
class ContentSafetyRail(BaseRail):
    """
    Detect and block toxic, harmful, or inappropriate content.

    Uses Detoxify model for detecting:
    - Toxicity
    - Severe toxicity
    - Obscene content
    - Threats
    - Insults
    - Identity hate
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize content safety rail."""
        super().__init__(config)

        if not DETOXIFY_AVAILABLE:
            raise ImportError(
                "Detoxify is required for ContentSafetyRail. "
                "Install it with: pip install detoxify"
            )

        # Initialize Detoxify model
        model_type = self.config.get("model_type", "original")
        self.model = Detoxify(model_type)

        # Configuration
        self.threshold = self.config.get("threshold", 0.8)
        self.block_topics = self.config.get("block_topics", [
            "violence",
            "illegal_activities",
            "hate_speech",
            "self_harm",
            "sexual_content"
        ])
        self.action = self.config.get("action", "block")  # block, warn, redact

        # Category thresholds (can be customized per category)
        self.category_thresholds = self.config.get("category_thresholds", {
            "toxicity": self.threshold,
            "severe_toxicity": self.threshold * 0.7,  # Lower threshold for severe
            "obscene": self.threshold,
            "threat": self.threshold * 0.8,
            "insult": self.threshold,
            "identity_hate": self.threshold * 0.7,
        })

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process user input for content safety violations.

        Args:
            input_text: The user's input text
            context: Processing context

        Returns:
            Dictionary with blocking decision and details
        """
        # Run toxicity detection
        results = self.model.predict(input_text)

        # Check each category against thresholds
        violations = []
        max_score = 0.0
        max_category = None

        for category, score in results.items():
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

        # Determine action
        if violations:
            if self.action == "block":
                return {
                    "blocked": True,
                    "severity": self._get_severity(max_score),
                    "message": f"Content blocked due to {max_category} (score: {max_score:.2f})",
                    "details": {
                        "violations": violations,
                        "max_score": max_score,
                        "max_category": max_category,
                        "all_scores": {k: float(v) for k, v in results.items()}
                    }
                }
            elif self.action == "warn":
                return {
                    "blocked": False,
                    "warning": f"Content may contain {max_category} (score: {max_score:.2f})",
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

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process LLM output for content safety violations.

        Uses the same logic as process_input.
        """
        return await self.process_input(output_text, context)

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
            "name": "content_safety",
            "version": "1.0.0",
            "model_type": self.config.get("model_type", "original"),
            "threshold": self.threshold,
            "action": self.action,
            "capabilities": ["input", "output"],
        }
