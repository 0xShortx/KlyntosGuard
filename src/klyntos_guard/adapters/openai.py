"""OpenAI LLM adapter."""

from datetime import datetime
from typing import Any, Dict, List, Optional

import structlog
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion

from klyntos_guard.adapters.base import BaseLLMAdapter
from klyntos_guard.core.types import LLMResponse, ProcessingContext

logger = structlog.get_logger(__name__)


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for OpenAI GPT models."""

    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        organization: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialize OpenAI adapter.

        Args:
            api_key: OpenAI API key
            model: Model name (gpt-4, gpt-3.5-turbo, etc.)
            organization: OpenAI organization ID
            **kwargs: Additional configuration
        """
        super().__init__(api_key=api_key, model=model or "gpt-4", **kwargs)

        self.client = AsyncOpenAI(
            api_key=api_key,
            organization=organization,
        )

        logger.info(
            "openai_adapter_initialized",
            model=self.model,
            has_organization=organization is not None,
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        """
        Generate a response using OpenAI.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            context: Processing context
            **kwargs: Additional generation parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            # Prepare parameters
            params = {
                "model": kwargs.get("model", self.model),
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens"),
                "top_p": kwargs.get("top_p", 1.0),
                "frequency_penalty": kwargs.get("frequency_penalty", 0.0),
                "presence_penalty": kwargs.get("presence_penalty", 0.0),
            }

            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}

            # Make API call
            response: ChatCompletion = await self.client.chat.completions.create(**params)

            # Extract response
            choice = response.choices[0]
            content = choice.message.content or ""

            # Build usage info
            usage = {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
            }

            logger.info(
                "openai_generation_complete",
                model=params["model"],
                tokens_used=usage["total_tokens"],
                finish_reason=choice.finish_reason,
            )

            return LLMResponse(
                provider="openai",
                model=params["model"],
                content=content,
                usage=usage,
                finish_reason=choice.finish_reason or "stop",
                metadata={
                    "response_id": response.id,
                    "created": response.created,
                    "system_fingerprint": response.system_fingerprint,
                },
            )

        except Exception as e:
            logger.error("openai_generation_error", error=str(e), exc_info=True)
            raise

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ):
        """
        Generate a streaming response using OpenAI.

        Args:
            messages: List of message dictionaries
            context: Processing context
            **kwargs: Additional generation parameters

        Yields:
            Chunks of the generated response
        """
        try:
            # Prepare parameters
            params = {
                "model": kwargs.get("model", self.model),
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens"),
                "stream": True,
            }

            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}

            # Make streaming API call
            stream = await self.client.chat.completions.create(**params)

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error("openai_streaming_error", error=str(e), exc_info=True)
            raise

    async def embed(
        self,
        texts: List[str],
        **kwargs: Any,
    ) -> List[List[float]]:
        """
        Generate embeddings using OpenAI.

        Args:
            texts: List of texts to embed
            **kwargs: Additional embedding parameters

        Returns:
            List of embedding vectors
        """
        try:
            model = kwargs.get("model", "text-embedding-ada-002")

            response = await self.client.embeddings.create(
                model=model,
                input=texts,
            )

            embeddings = [item.embedding for item in response.data]

            logger.info(
                "openai_embeddings_complete",
                model=model,
                num_texts=len(texts),
                tokens_used=response.usage.total_tokens if response.usage else 0,
            )

            return embeddings

        except Exception as e:
            logger.error("openai_embedding_error", error=str(e), exc_info=True)
            raise

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "openai"
