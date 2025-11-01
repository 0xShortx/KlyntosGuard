"""Base adapter class for LLM integrations."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from klyntos_guard.core.types import LLMRequest, LLMResponse, ProcessingContext


class BaseLLMAdapter(ABC):
    """
    Base class for LLM provider adapters.

    Adapters provide a unified interface for interacting with different
    LLM providers (OpenAI, Anthropic, Google, Azure, etc.).
    """

    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialize the adapter.

        Args:
            api_key: API key for the LLM provider
            model: Default model to use
            **kwargs: Additional provider-specific configuration
        """
        self.api_key = api_key
        self.model = model
        self.config = kwargs

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        """
        Generate a response from the LLM.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            context: Processing context for tracking and metadata
            **kwargs: Additional generation parameters

        Returns:
            LLMResponse with the generated content and metadata
        """
        pass

    @abstractmethod
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ):
        """
        Generate a streaming response from the LLM.

        Args:
            messages: List of message dictionaries
            context: Processing context
            **kwargs: Additional generation parameters

        Yields:
            Chunks of the generated response
        """
        pass

    @abstractmethod
    async def embed(
        self,
        texts: List[str],
        **kwargs: Any,
    ) -> List[List[float]]:
        """
        Generate embeddings for texts.

        Args:
            texts: List of texts to embed
            **kwargs: Additional embedding parameters

        Returns:
            List of embedding vectors
        """
        pass

    async def validate_connection(self) -> bool:
        """
        Validate the connection to the LLM provider.

        Returns:
            True if connection is valid, False otherwise
        """
        try:
            # Try a simple generation to validate
            response = await self.generate(
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5,
            )
            return response is not None
        except Exception:
            return False

    def get_provider_name(self) -> str:
        """
        Get the name of the LLM provider.

        Returns:
            Provider name (e.g., "openai", "anthropic", "google")
        """
        return self.__class__.__name__.replace("Adapter", "").lower()

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about this adapter.

        Returns:
            Dictionary with adapter metadata
        """
        return {
            "provider": self.get_provider_name(),
            "model": self.model,
            "config": {k: v for k, v in self.config.items() if k != "api_key"},
        }
