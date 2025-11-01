"""Base classes for guardrails."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from klyntos_guard.core.types import ProcessingContext


class BaseRail(ABC):
    """
    Base class for all guardrail implementations.

    Subclasses should implement one or more of the processing methods
    depending on which rail types they support.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the rail with configuration.

        Args:
            config: Configuration dictionary for this rail
        """
        self.config = config or {}

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process user input through this rail.

        Args:
            input_text: The user's input text
            context: Processing context

        Returns:
            Dictionary with:
                - blocked (bool): Whether to block the input
                - message (str): Reason for blocking (if blocked)
                - severity (str): Severity level if blocked
                - warning (str): Warning message if not blocked but concerning
                - transformed_input (str): Modified input if transformation applied
                - details (dict): Additional details about the decision
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement input rail processing"
        )

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process LLM output through this rail.

        Args:
            output_text: The LLM's output text
            context: Processing context

        Returns:
            Dictionary with same structure as process_input
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement output rail processing"
        )

    async def process_dialog(
        self, text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process dialog flow through this rail.

        Args:
            text: The text in the dialog flow
            context: Processing context

        Returns:
            Dictionary with same structure as process_input
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement dialog rail processing"
        )

    async def process_retrieval(
        self, retrieved_chunks: list, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process retrieved chunks in RAG scenarios.

        Args:
            retrieved_chunks: List of retrieved text chunks
            context: Processing context

        Returns:
            Dictionary with:
                - blocked (bool): Whether to block the retrieval
                - message (str): Reason for blocking
                - filtered_chunks (list): Filtered/modified chunks
                - details (dict): Additional details
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement retrieval rail processing"
        )

    async def process_execution(
        self, execution_request: Dict[str, Any], context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Process code/tool execution requests.

        Args:
            execution_request: Details of the execution request
            context: Processing context

        Returns:
            Dictionary with same structure as process_input
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement execution rail processing"
        )

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about this rail.

        Returns:
            Dictionary with rail metadata (name, version, capabilities, etc.)
        """
        return {
            "name": self.__class__.__name__,
            "config": self.config,
        }


class SyncRail(BaseRail):
    """
    Base class for synchronous rails.

    Provides default async wrappers around synchronous processing methods.
    """

    async def process_input(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Async wrapper for synchronous input processing."""
        return self.process_input_sync(input_text, context)

    async def process_output(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """Async wrapper for synchronous output processing."""
        return self.process_output_sync(output_text, context)

    def process_input_sync(
        self, input_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Synchronous input processing.

        Override this method for synchronous input rails.
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement synchronous input processing"
        )

    def process_output_sync(
        self, output_text: str, context: ProcessingContext
    ) -> Dict[str, Any]:
        """
        Synchronous output processing.

        Override this method for synchronous output rails.
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} does not implement synchronous output processing"
        )
