"""Google Gemini LLM adapter."""

from typing import Any, Dict, List, Optional

import structlog
import google.generativeai as genai

from klyntos_guard.adapters.base import BaseLLMAdapter
from klyntos_guard.core.types import LLMResponse, ProcessingContext

logger = structlog.get_logger(__name__)


class GoogleAdapter(BaseLLMAdapter):
    """Adapter for Google Gemini models."""

    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        **kwargs: Any,
    ):
        """
        Initialize Google Gemini adapter.

        Args:
            api_key: Google API key
            model: Model name (gemini-pro, gemini-pro-vision, etc.)
            **kwargs: Additional configuration
        """
        super().__init__(
            api_key=api_key,
            model=model or "gemini-pro",
            **kwargs
        )

        # Configure API
        genai.configure(api_key=api_key)

        # Initialize model
        self.gen_model = genai.GenerativeModel(self.model)

        logger.info(
            "google_adapter_initialized",
            model=self.model,
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        """
        Generate a response using Google Gemini.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            context: Processing context
            **kwargs: Additional generation parameters

        Returns:
            LLMResponse with generated content
        """
        try:
            # Convert messages to Gemini format
            # Gemini uses a simpler format - just the content
            formatted_messages = self._format_messages(messages)

            # Generation config
            generation_config = genai.types.GenerationConfig(
                temperature=kwargs.get("temperature", 0.7),
                top_p=kwargs.get("top_p", 1.0),
                max_output_tokens=kwargs.get("max_tokens", 2048),
            )

            # Make API call
            response = await self.gen_model.generate_content_async(
                formatted_messages,
                generation_config=generation_config,
            )

            # Extract response
            content = response.text if response.text else ""

            # Estimate token usage (Gemini doesn't provide exact counts)
            # Using rough estimation: ~4 chars per token
            prompt_text = " ".join(msg["content"] for msg in messages)
            usage = {
                "prompt_tokens": len(prompt_text) // 4,
                "completion_tokens": len(content) // 4,
                "total_tokens": (len(prompt_text) + len(content)) // 4,
            }

            logger.info(
                "google_generation_complete",
                model=self.model,
                estimated_tokens=usage["total_tokens"],
            )

            return LLMResponse(
                provider="google",
                model=self.model,
                content=content,
                usage=usage,
                finish_reason="stop",
                metadata={
                    "prompt_feedback": str(response.prompt_feedback) if hasattr(response, "prompt_feedback") else None,
                },
            )

        except Exception as e:
            logger.error("google_generation_error", error=str(e), exc_info=True)
            raise

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        context: Optional[ProcessingContext] = None,
        **kwargs: Any,
    ):
        """
        Generate a streaming response using Google Gemini.

        Args:
            messages: List of message dictionaries
            context: Processing context
            **kwargs: Additional generation parameters

        Yields:
            Chunks of the generated response
        """
        try:
            # Convert messages
            formatted_messages = self._format_messages(messages)

            # Generation config
            generation_config = genai.types.GenerationConfig(
                temperature=kwargs.get("temperature", 0.7),
                top_p=kwargs.get("top_p", 1.0),
                max_output_tokens=kwargs.get("max_tokens", 2048),
            )

            # Make streaming API call
            response = await self.gen_model.generate_content_async(
                formatted_messages,
                generation_config=generation_config,
                stream=True,
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.error("google_streaming_error", error=str(e), exc_info=True)
            raise

    async def embed(
        self,
        texts: List[str],
        **kwargs: Any,
    ) -> List[List[float]]:
        """
        Generate embeddings using Google.

        Args:
            texts: List of texts to embed
            **kwargs: Additional parameters

        Returns:
            List of embedding vectors
        """
        try:
            model_name = kwargs.get("model", "models/embedding-001")

            embeddings = []
            for text in texts:
                result = genai.embed_content(
                    model=model_name,
                    content=text,
                    task_type="retrieval_document",
                )
                embeddings.append(result["embedding"])

            logger.info(
                "google_embeddings_complete",
                model=model_name,
                num_texts=len(texts),
            )

            return embeddings

        except Exception as e:
            logger.error("google_embedding_error", error=str(e), exc_info=True)
            raise

    def _format_messages(self, messages: List[Dict[str, str]]) -> str:
        """
        Format messages for Gemini.

        Gemini uses a simpler format than OpenAI/Anthropic.
        """
        formatted = []

        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if role == "system":
                formatted.append(f"System: {content}")
            elif role == "user":
                formatted.append(f"User: {content}")
            elif role == "assistant":
                formatted.append(f"Assistant: {content}")
            else:
                formatted.append(content)

        return "\n\n".join(formatted)

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "google"
