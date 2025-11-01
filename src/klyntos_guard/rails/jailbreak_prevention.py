"""Jailbreak and prompt injection prevention rail."""

import re
from typing import Any, Dict, List, Optional

from klyntos_guard.core.types import ProcessingContext
from klyntos_guard.rails.base import BaseRail
from klyntos_guard.rails.registry import register_rail


@register_rail("jailbreak_prevention")
class JailbreakPreventionRail(BaseRail):
    """
    Detect and block jailbreak attempts and prompt injection attacks.

    Detects patterns like:
    - "Ignore previous instructions"
    - "Disregard all rules"
    - "You are now in DAN mode"
    - Role-playing attacks
    - System prompt leakage attempts
    """

    # Known jailbreak patterns
    DEFAULT_PATTERNS = [
        # Direct instruction override
        r"ignore\s+(previous|all|prior)\s+instructions",
        r"disregard\s+(all|previous|prior)\s+(rules|instructions|guidelines)",
        r"forget\s+(everything|all)\s+(you|we)\s+(discussed|said)",

        # Role-playing jailbreaks
        r"you\s+are\s+now\s+(in\s+)?(\w+\s+)?mode",
        r"pretend\s+(you|to\s+be)",
        r"act\s+as\s+(if\s+)?(you|a)",
        r"roleplay\s+as",

        # DAN and similar
        r"\bDAN\b",  # Do Anything Now
        r"developer\s+mode",
        r"jailbreak",

        # System prompt attacks
        r"what\s+(were|are)\s+your\s+(original|initial)\s+instructions",
        r"reveal\s+your\s+(system\s+)?prompt",
        r"show\s+me\s+your\s+instructions",

        # Instruction injection
        r"new\s+instructions?:",
        r"updated\s+guidelines?:",
        r"revised\s+rules?:",

        # Encoding/obfuscation attempts
        r"base64",
        r"rot13",
        r"decode\s+this",
    ]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize jailbreak prevention rail."""
        super().__init__(config)

        # Get patterns from config or use defaults
        pattern_list = self.config.get("block_patterns", self.DEFAULT_PATTERNS)

        # Additional custom patterns
        custom_patterns = self.config.get("custom_patterns", [])
        pattern_list.extend(custom_patterns)

        # Compile patterns
        self.patterns = [
            re.compile(pattern, re.IGNORECASE)
            for pattern in pattern_list
        ]

        # Detection methods
        self.detection_methods = self.config.get("detection_methods", [
            "pattern_matching",
            "llm_based"  # Can be implemented with LLM
        ])

        # Sensitivity
        self.sensitivity = self.config.get("sensitivity", "medium")
        self.threshold = {
            "low": 0.3,
            "medium": 0.5,
            "high": 0.7
        }[self.sensitivity]

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process user input for jailbreak attempts.

        Args:
            input_text: The user's input text
            context: Processing context

        Returns:
            Dictionary with blocking decision and details
        """
        # Pattern-based detection
        matches = []
        for pattern in self.patterns:
            found = pattern.finditer(input_text)
            for match in found:
                matches.append({
                    "pattern": pattern.pattern,
                    "match": match.group(),
                    "start": match.start(),
                    "end": match.end()
                })

        # Check for suspicious characteristics
        suspicion_score = self._calculate_suspicion_score(input_text, matches)

        if suspicion_score >= self.threshold or len(matches) > 0:
            return {
                "blocked": True,
                "severity": "high" if suspicion_score > 0.8 else "medium",
                "message": f"Potential jailbreak attempt detected (score: {suspicion_score:.2f})",
                "details": {
                    "suspicion_score": suspicion_score,
                    "pattern_matches": matches,
                    "match_count": len(matches),
                    "characteristics": self._get_suspicious_characteristics(input_text)
                }
            }

        return {"blocked": False}

    def _calculate_suspicion_score(
        self, text: str, matches: List[Dict]
    ) -> float:
        """Calculate suspicion score based on various factors."""
        score = 0.0

        # Pattern matches (weighted heavily)
        if len(matches) > 0:
            score += min(len(matches) * 0.3, 0.6)

        # Multiple role-playing keywords
        roleplay_keywords = ["pretend", "act as", "roleplay", "imagine you"]
        roleplay_count = sum(1 for kw in roleplay_keywords if kw.lower() in text.lower())
        if roleplay_count >= 2:
            score += 0.2

        # System/instruction keywords
        system_keywords = ["system", "prompt", "instructions", "rules", "guidelines"]
        system_count = sum(1 for kw in system_keywords if kw.lower() in text.lower())
        if system_count >= 3:
            score += 0.2

        # Excessive special characters (obfuscation attempt)
        special_char_ratio = sum(1 for c in text if not c.isalnum() and c != ' ') / max(len(text), 1)
        if special_char_ratio > 0.2:
            score += 0.15

        # Very long input (possible injection)
        if len(text) > 1000:
            score += 0.1

        # Multiple commands/directives
        command_indicators = text.lower().count("you must") + text.lower().count("you will") + text.lower().count("you shall")
        if command_indicators >= 2:
            score += 0.15

        return min(score, 1.0)

    def _get_suspicious_characteristics(self, text: str) -> Dict[str, Any]:
        """Get characteristics that make the input suspicious."""
        return {
            "length": len(text),
            "has_roleplay_keywords": any(
                kw in text.lower()
                for kw in ["pretend", "act as", "roleplay", "imagine"]
            ),
            "has_system_keywords": any(
                kw in text.lower()
                for kw in ["system", "prompt", "instructions"]
            ),
            "special_char_ratio": sum(
                1 for c in text if not c.isalnum() and c != ' '
            ) / max(len(text), 1),
        }

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Check if output reveals system information.

        Args:
            output_text: The LLM's output text
            context: Processing context

        Returns:
            Dictionary with blocking decision
        """
        # Check if output is revealing system prompts or instructions
        revelation_patterns = [
            r"my\s+instructions\s+(are|were)",
            r"i\s+was\s+told\s+to",
            r"my\s+system\s+prompt",
            r"according\s+to\s+my\s+programming",
        ]

        for pattern_str in revelation_patterns:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            if pattern.search(output_text):
                return {
                    "blocked": True,
                    "severity": "high",
                    "message": "Output may reveal system information",
                    "details": {
                        "matched_pattern": pattern_str
                    }
                }

        return {"blocked": False}

    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about this rail."""
        return {
            "name": "jailbreak_prevention",
            "version": "1.0.0",
            "sensitivity": self.sensitivity,
            "pattern_count": len(self.patterns),
            "capabilities": ["input", "output"],
        }
