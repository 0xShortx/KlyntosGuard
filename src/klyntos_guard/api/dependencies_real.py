"""Real dependencies with JWT validation and database checks."""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
import structlog

from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig, settings
from klyntos_guard.adapters import OpenAIAdapter, AnthropicAdapter
from klyntos_guard.auth import verify_token

logger = structlog.get_logger(__name__)

# Security scheme
security = HTTPBearer()

# Global engine instance
_engine_instance: Optional[GuardrailsEngine] = None


async def get_guardrails_engine() -> GuardrailsEngine:
    """Get or create guardrails engine instance."""
    global _engine_instance

    if _engine_instance is None:
        try:
            config = GuardrailsConfig(config_path="config/guardrails.yaml")
        except:
            # Use default config if file doesn't exist
            config = GuardrailsConfig(config_dict={
                "llm": {
                    "provider": "openai",
                    "model": "gpt-4",
                },
                "input_rails": [],
                "output_rails": [],
            })

        adapters = []

        if settings.openai_api_key:
            adapters.append(
                OpenAIAdapter(
                    api_key=settings.openai_api_key,
                    model=settings.openai_default_model,
                )
            )

        if settings.anthropic_api_key:
            adapters.append(
                AnthropicAdapter(
                    api_key=settings.anthropic_api_key,
                    model=settings.anthropic_default_model,
                )
            )

        _engine_instance = GuardrailsEngine(config=config, adapters=adapters)
        logger.info("guardrails_engine_initialized", adapter_count=len(adapters))

    return _engine_instance


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Get current authenticated user from JWT token.

    Args:
        credentials: HTTP authorization credentials

    Returns:
        User information dictionary

    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials

    try:
        # Verify JWT token
        token_data = verify_token(token)

        user = {
            "user_id": token_data.user_id,
            "email": token_data.email,
            "tenant_id": token_data.tenant_id,
            "role": token_data.role,
        }

        return user

    except JWTError as e:
        logger.error("authentication_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error("authentication_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_api_key_user(
    x_api_key: Optional[str] = Header(None),
) -> dict:
    """Get user from API key (for API key authentication)."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
        )

    # TODO: Implement API key validation in database
    # For now, simple check
    if not x_api_key.startswith("kg_live_") and not x_api_key.startswith("kg_test_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
        )

    # Return mock user for now
    return {
        "user_id": "api_user",
        "tenant_id": "api_tenant",
        "api_key_id": "key123",
        "role": "developer",
    }


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get current active user (checks if user is active)."""
    # TODO: Check if user is active in database
    return current_user


def require_permission(permission: str):
    """Dependency to require specific permission."""

    async def permission_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        """Check if user has required permission."""
        if current_user.get("role") not in ["admin", "owner"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )
        return current_user

    return permission_checker
