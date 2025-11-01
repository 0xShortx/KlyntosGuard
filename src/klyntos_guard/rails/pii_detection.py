"""PII detection and redaction rail using Presidio."""

import re
from typing import Any, Dict, List, Optional

try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
    PRESIDIO_AVAILABLE = True
except ImportError:
    PRESIDIO_AVAILABLE = False

from klyntos_guard.core.types import ProcessingContext
from klyntos_guard.rails.base import BaseRail
from klyntos_guard.rails.registry import register_rail


@register_rail("pii_detection")
class PIIDetectionRail(BaseRail):
    """
    Detect and redact personally identifiable information (PII).

    Supports detection of:
    - Email addresses
    - Phone numbers
    - SSN
    - Credit card numbers
    - IP addresses
    - Names
    - Addresses
    - And more...
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize PII detection rail."""
        super().__init__(config)

        if not PRESIDIO_AVAILABLE:
            raise ImportError(
                "Presidio is required for PIIDetectionRail. "
                "Install it with: pip install presidio-analyzer presidio-anonymizer"
            )

        # Initialize Presidio engines
        self.analyzer = AnalyzerEngine()
        self.anonymizer = AnonymizerEngine()

        # Configuration
        self.entities_to_detect = self.config.get("detect", [
            "EMAIL_ADDRESS",
            "PHONE_NUMBER",
            "CREDIT_CARD",
            "US_SSN",
            "IP_ADDRESS",
            "PERSON",
            "LOCATION",
            "DATE_TIME"
        ])

        self.action = self.config.get("action", "redact")  # redact, block, warn
        self.locale = self.config.get("locale", "en")
        self.score_threshold = self.config.get("score_threshold", 0.5)

        # Redaction template
        self.redaction_template = self.config.get(
            "redaction_template",
            "[{} REDACTED]"
        )

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process user input for PII detection and redaction.

        Args:
            input_text: The user's input text
            context: Processing context

        Returns:
            Dictionary with blocking decision, redacted text, and details
        """
        # Analyze for PII
        analyzer_results = self.analyzer.analyze(
            text=input_text,
            entities=self.entities_to_detect,
            language=self.locale,
            score_threshold=self.score_threshold
        )

        # Check if PII was found
        if not analyzer_results:
            return {
                "blocked": False,
                "details": {"pii_found": False}
            }

        # PII detected - handle based on action
        pii_details = [
            {
                "entity_type": result.entity_type,
                "start": result.start,
                "end": result.end,
                "score": result.score,
                "text": input_text[result.start:result.end]
            }
            for result in analyzer_results
        ]

        if self.action == "block":
            return {
                "blocked": True,
                "severity": "high",
                "message": f"Input contains PII: {', '.join([r.entity_type for r in analyzer_results])}",
                "details": {
                    "pii_found": True,
                    "pii_entities": pii_details,
                    "count": len(analyzer_results)
                }
            }

        elif self.action == "redact":
            # Redact PII
            operators = {
                entity_type: OperatorConfig(
                    "replace",
                    {"new_value": self.redaction_template.format(entity_type)}
                )
                for entity_type in self.entities_to_detect
            }

            anonymized_result = self.anonymizer.anonymize(
                text=input_text,
                analyzer_results=analyzer_results,
                operators=operators
            )

            return {
                "blocked": False,
                "transformed_input": anonymized_result.text,
                "warning": f"PII redacted: {len(analyzer_results)} instances",
                "details": {
                    "pii_found": True,
                    "pii_entities": pii_details,
                    "redacted_count": len(analyzer_results),
                    "original_text": input_text
                }
            }

        elif self.action == "warn":
            return {
                "blocked": False,
                "warning": f"PII detected: {', '.join([r.entity_type for r in analyzer_results])}",
                "details": {
                    "pii_found": True,
                    "pii_entities": pii_details
                }
            }

        return {"blocked": False}

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process LLM output for PII detection and redaction.

        Uses the same logic as process_input.
        """
        return await self.process_input(output_text, context)

    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about this rail."""
        return {
            "name": "pii_detection",
            "version": "1.0.0",
            "entities": self.entities_to_detect,
            "action": self.action,
            "locale": self.locale,
            "capabilities": ["input", "output"],
        }


@register_rail("pii_detection_simple")
class SimplePIIDetectionRail(BaseRail):
    """
    Simple regex-based PII detection (fallback when Presidio not available).

    Detects:
    - Email addresses
    - Phone numbers (US format)
    - SSN (US format)
    - Credit card numbers
    """

    # Regex patterns
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    PHONE_PATTERN = r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b'
    SSN_PATTERN = r'\b(?!000|666|9\d{2})\d{3}[-]?(?!00)\d{2}[-]?(?!0000)\d{4}\b'
    CC_PATTERN = r'\b(?:\d{4}[-\s]?){3}\d{4}\b'

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize simple PII detection rail."""
        super().__init__(config)

        self.action = self.config.get("action", "redact")
        self.patterns = {
            "EMAIL": re.compile(self.EMAIL_PATTERN),
            "PHONE": re.compile(self.PHONE_PATTERN),
            "SSN": re.compile(self.SSN_PATTERN),
            "CREDIT_CARD": re.compile(self.CC_PATTERN),
        }

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Process input for PII using regex patterns."""
        detections = []
        redacted_text = input_text

        # Check each pattern
        for entity_type, pattern in self.patterns.items():
            matches = pattern.finditer(input_text)
            for match in matches:
                detections.append({
                    "entity_type": entity_type,
                    "text": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })

                # Redact if configured
                if self.action == "redact":
                    redacted_text = redacted_text.replace(
                        match.group(),
                        f"[{entity_type} REDACTED]"
                    )

        if not detections:
            return {"blocked": False}

        if self.action == "block":
            return {
                "blocked": True,
                "severity": "high",
                "message": f"PII detected: {len(detections)} instances",
                "details": {"detections": detections}
            }

        elif self.action == "redact":
            return {
                "blocked": False,
                "transformed_input": redacted_text,
                "warning": f"PII redacted: {len(detections)} instances",
                "details": {"detections": detections}
            }

        return {"blocked": False, "warning": "PII detected"}

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Process output using same logic."""
        return await self.process_input(output_text, context)
