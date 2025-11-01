"""Anthropic Claude LLM adapter."""

from typing import Any, Dict, List, Optional

import structlog
from anthropic import AsyncAnthropic

from klyntos_guard.adapters.base import BaseLLMAdapter
from klyntos_guard.core.types import LLMResponse, ProcessingContext

logger = structlog.get_logger(__name__)


class AnthropicAdapter(BaseLLMAdapter):
    """Adapter for Anthropic Claude models."""

    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialize Anthropic adapter.

        Args:
            api_key: Anthropic API key
            model: Model name (claude-3-opus-20240229, claude-3-sonnet-20240229, etc.)
            **kwargs: Additional configuration
        """
        super().__init__(
            api_key=api_key,
            model=model or "claude-3-opus-20240229",
            **kwargs
        )

        self.client = AsyncAnthropic(api_key=api_key)

        logger.info(
            "anthropic_adapter_initialized",
            model=self.model,
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        """
        Generate a response using Anthropic Claude.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            context: Processing context
            **kwargs: Additional generation parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            # Extract system message if present
            system_message = None
            formatted_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    formatted_messages.append(msg)

            # Prepare parameters
            params = {
                "model": kwargs.get("model", self.model),
                "messages": formatted_messages,
                "max_tokens": kwargs.get("max_tokens", 4096),
                "temperature": kwargs.get("temperature", 0.7),
                "top_p": kwargs.get("top_p", 1.0),
            }

            if system_message:
                params["system"] = system_message

            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}

            # Make API call
            response = await self.client.messages.create(**params)

            # Extract response
            content = ""
            if response.content:
                for block in response.content:
                    if hasattr(block, "text"):
                        content += block.text

            # Build usage info
            usage = {
                "prompt_tokens": response.usage.input_tokens if response.usage else 0,
                "completion_tokens": response.usage.output_tokens if response.usage else 0,
                "total_tokens": (
                    (response.usage.input_tokens + response.usage.output_tokens)
                    if response.usage else 0
                ),
            }

            logger.info(
                "anthropic_generation_complete",
                model=params["model"],
                tokens_used=usage["total_tokens"],
                stop_reason=response.stop_reason,
            )

            return LLMResponse(
                provider="anthropic",
                model=params["model"],
                content=content,
                usage=usage,
                finish_reason=response.stop_reason or "end_turn",
                metadata={
                    "response_id": response.id,
                    "type": response.type,
                    "role": response.role,
                },
            )

        except Exception as e:
            logger.error("anthropic_generation_error", error=str(e), exc_info=True)
            raise

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ):
        """
        Generate a streaming response using Anthropic Claude.

        Args:
            messages: List of message dictionaries
            context: Processing context
            **kwargs: Additional generation parameters

        Yields:
            Chunks of the generated response
        """
        try:
            # Extract system message
            system_message = None
            formatted_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    formatted_messages.append(msg)

            # Prepare parameters
            params = {
                "model": kwargs.get("model", self.model),
                "messages": formatted_messages,
                "max_tokens": kwargs.get("max_tokens", 4096),
                "temperature": kwargs.get("temperature", 0.7),
                "stream": True,
            }

            if system_message:
                params["system"] = system_message

            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}

            # Make streaming API call
            async with self.client.messages.stream(**params) as stream:
                async for text in stream.text_stream:
                    yield text

        except Exception as e:
            logger.error("anthropic_streaming_error", error=str(e), exc_info=True)
            raise

    async def embed(
        self,
        texts: List[str],
        **kwargs: Any,
    ) -> List[List[float]]:
        """
        Generate embeddings.

        Note: Anthropic doesn't provide an embedding API yet.
        This is a placeholder that raises NotImplementedError.

        Args:
            texts: List of texts to embed
            **kwargs: Additional parameters

        Raises:
            NotImplementedError: Anthropic doesn't provide embeddings
        """
        raise NotImplementedError(
            "Anthropic does not currently provide an embedding API. "
            "Use OpenAI or another provider for embeddings."
        )

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "anthropic"
