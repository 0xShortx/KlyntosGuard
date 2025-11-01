"""Topic control and classification rail."""

from typing import Any, Dict, List, Optional

from klyntos_guard.core.types import ProcessingContext
from klyntos_guard.rails.base import BaseRail
from klyntos_guard.rails.registry import register_rail


@register_rail("topic_control")
class TopicControlRail(BaseRail):
    """
    Control conversation topics by allowing/blocking specific subjects.

    Ensures conversations stay within allowed domains and prevents
    discussion of blocked topics.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize topic control rail."""
        super().__init__(config)

        # Allowed topics (whitelist)
        self.allowed_topics = self.config.get("allowed_topics", [])

        # Blocked topics (blacklist)
        self.blocked_topics = self.config.get("blocked_topics", [])

        # Topic keywords mapping
        self.topic_keywords = self.config.get("topic_keywords", {
            "politics": ["election", "president", "congress", "political", "vote", "candidate"],
            "religion": ["church", "mosque", "temple", "religious", "prayer", "worship"],
            "competitors": ["competitor", "rival company", "alternative"],
            "customer_support": ["help", "support", "issue", "problem", "question"],
            "product_information": ["product", "feature", "pricing", "plan"],
            "technical_questions": ["how to", "technical", "setup", "configure"],
        })

        # Action to take
        self.action = self.config.get("action", "block")  # block, warn, redirect

        # Redirect message
        self.redirect_message = self.config.get(
            "redirect_message",
            "I'm here to help with {allowed_topics}. How can I assist you with that?"
        )

        # Detection mode
        self.detection_mode = self.config.get("detection_mode", "keyword")  # keyword, llm

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process user input for topic classification and control.

        Args:
            input_text: The user's input text
            context: Processing context

        Returns:
            Dictionary with blocking decision and topic information
        """
        # Classify the topic
        detected_topics = self._classify_topic(input_text)

        # Check if any blocked topics detected
        blocked_topic_found = any(
            topic in self.blocked_topics
            for topic in detected_topics
        )

        if blocked_topic_found:
            blocked_list = [t for t in detected_topics if t in self.blocked_topics]

            if self.action == "block":
                return {
                    "blocked": True,
                    "severity": "medium",
                    "message": f"Topic not allowed: {', '.join(blocked_list)}",
                    "details": {
                        "detected_topics": detected_topics,
                        "blocked_topics": blocked_list,
                    },
                    "suggestion": self._get_redirect_message()
                }

            elif self.action == "warn":
                return {
                    "blocked": False,
                    "warning": f"Off-topic detected: {', '.join(blocked_list)}",
                    "details": {"detected_topics": detected_topics}
                }

            elif self.action == "redirect":
                return {
                    "blocked": True,
                    "severity": "low",
                    "message": "Topic outside allowed scope",
                    "suggestion": self._get_redirect_message(),
                    "details": {"detected_topics": detected_topics}
                }

        # Check if allowed topics are specified and none match
        if self.allowed_topics and not any(
            topic in self.allowed_topics
            for topic in detected_topics
        ):
            return {
                "blocked": True,
                "severity": "medium",
                "message": "Topic not in allowed list",
                "details": {
                    "detected_topics": detected_topics,
                    "allowed_topics": self.allowed_topics
                },
                "suggestion": self._get_redirect_message()
            }

        return {
            "blocked": False,
            "details": {"detected_topics": detected_topics}
        }

    async def process_dialog(
        self, text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Process dialog flow for topic steering."""
        return await self.process_input(text, context)

    def _classify_topic(self, text: str) -> List[str]:
        """
        Classify the topic of the text.

        Args:
            text: Text to classify

        Returns:
            List of detected topic labels
        """
        text_lower = text.lower()
        detected = []

        for topic, keywords in self.topic_keywords.items():
            # Check if any keyword is in the text
            if any(keyword.lower() in text_lower for keyword in keywords):
                detected.append(topic)

        # If no topics detected, mark as "general"
        if not detected:
            detected.append("general_inquiry")

        return detected

    def _get_redirect_message(self) -> str:
        """Get redirect message with allowed topics."""
        if self.allowed_topics:
            topics_str = ", ".join(self.allowed_topics)
            return self.redirect_message.format(allowed_topics=topics_str)
        return "Let me help you with your question."

    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about this rail."""
        return {
            "name": "topic_control",
            "version": "1.0.0",
            "allowed_topics": self.allowed_topics,
            "blocked_topics": self.blocked_topics,
            "detection_mode": self.detection_mode,
            "capabilities": ["input", "dialog"],
        }
