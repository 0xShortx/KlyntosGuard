"""Python SDK client for KlyntosGuard API."""

import httpx
from typing import Dict, List, Optional, Any
import structlog

logger = structlog.get_logger(__name__)


class KlyntosGuardClient:
    """
    Python SDK for KlyntosGuard API.

    Example usage:
        ```python
        from klyntos_guard.sdk import KlyntosGuardClient

        client = KlyntosGuardClient(api_key="your-api-key")

        result = await client.process("What's the weather?")

        if result["allowed"]:
            print("Safe:", result["processed_output"])
        else:
            print("Blocked:", result["violations"])
        ```
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://guard.klyntos.com/api/v1",
        timeout: float = 30.0,
    ):
        """
        Initialize KlyntosGuard client.

        Args:
            api_key: API key for authentication
            base_url: Base URL for API (default: production)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        # Create HTTP client
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self._get_headers(),
            timeout=timeout,
        )

        logger.info("klyntos_guard_client_initialized", base_url=base_url)

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "KlyntosGuard-Python-SDK/0.1.0",
        }

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        return headers

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None,
        config_override: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process input through guardrails.

        Args:
            input_text: Text to process
            context: Processing context (user_id, etc.)
            config_override: Optional config overrides

        Returns:
            Guardrails processing result

        Raises:
            httpx.HTTPError: If request fails
        """
        try:
            response = await self.client.post(
                "/guardrails/process",
                json={
                    "input": input_text,
                    "context": context,
                    "config_override": config_override,
                },
            )
            response.raise_for_status()

            result = response.json()

            logger.info(
                "guardrails_processed",
                allowed=result.get("allowed"),
                processing_time_ms=result.get("processing_time_ms"),
            )

            return result

        except httpx.HTTPError as e:
            logger.error("guardrails_processing_failed", error=str(e))
            raise

    async def get_subscription(self) -> Dict[str, Any]:
        """
        Get current subscription details.

        Returns:
            Subscription information
        """
        response = await self.client.get("/subscriptions/current")
        response.raise_for_status()
        return response.json()

    async def get_usage(self) -> Dict[str, Any]:
        """
        Get usage statistics.

        Returns:
            Usage statistics
        """
        # TODO: Implement usage endpoint
        return {
            "requests_used": 0,
            "requests_quota": 100000,
        }

    async def get_audit_logs(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Get audit logs.

        Args:
            limit: Maximum number of logs
            offset: Pagination offset

        Returns:
            List of audit logs
        """
        response = await self.client.get(
            "/audit/logs",
            params={"limit": limit, "offset": offset},
        )
        response.raise_for_status()
        return response.json()["logs"]

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()


# Synchronous wrapper for ease of use
class SyncKlyntosGuardClient:
    """
    Synchronous wrapper for KlyntosGuard API.

    For use in non-async code.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://guard.klyntos.com/api/v1"):
        """Initialize sync client."""
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.Client(
            base_url=base_url,
            headers=self._get_headers(),
        )

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def process(self, input_text: str, **kwargs) -> Dict[str, Any]:
        """Process input (synchronous)."""
        response = self.client.post(
            "/guardrails/process",
            json={"input": input_text, **kwargs},
        )
        response.raise_for_status()
        return response.json()

    def close(self):
        """Close the client."""
        self.client.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
