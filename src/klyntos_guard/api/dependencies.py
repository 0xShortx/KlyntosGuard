"""Shared dependencies for API endpoints."""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig, settings
from klyntos_guard.adapters import OpenAIAdapter

logger = structlog.get_logger(__name__)

# Security scheme
security = HTTPBearer()


# Global engine instance (singleton)
_engine_instance: Optional[GuardrailsEngine] = None


async def get_guardrails_engine() -> GuardrailsEngine:
    """
    Get or create guardrails engine instance.

    Returns:
        GuardrailsEngine instance
    """
    global _engine_instance

    if _engine_instance is None:
        # Initialize configuration
        config = GuardrailsConfig(config_path="config/guardrails.yaml")

        # Initialize adapters
        adapters = []

        if settings.openai_api_key:
            adapters.append(
                OpenAIAdapter(
                    api_key=settings.openai_api_key,
                    model=settings.openai_default_model,
                )
            )

        # Create engine
        _engine_instance = GuardrailsEngine(
            config=config,
            adapters=adapters,
        )

        logger.info("guardrails_engine_initialized")

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
        # TODO: Implement JWT token validation
        # For now, return mock user
        # In production, decode and validate JWT:
        # from klyntos_guard.api.middleware.auth import decode_jwt
        # payload = decode_jwt(token)

        # Mock user data
        user = {
            "user_id": "user123",
            "tenant_id": "tenant123",
            "email": "user@example.com",
            "role": "admin",
        }

        return user

    except Exception as e:
        logger.error("authentication_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_api_key_user(
    x_api_key: Optional[str] = Header(None),
) -> dict:
    """
    Get user from API key.

    Args:
        x_api_key: API key from header

    Returns:
        User information dictionary

    Raises:
        HTTPException: If API key is invalid
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
        )

    try:
        # TODO: Implement API key validation
        # In production:
        # 1. Hash the API key
        # 2. Look up in database
        # 3. Check if active and not expired
        # 4. Return associated user/tenant

        # Mock user data
        user = {
            "user_id": "api_user",
            "tenant_id": "api_tenant",
            "api_key_id": "key123",
            "role": "developer",
        }

        return user

    except Exception as e:
        logger.error("api_key_validation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Get current active user (checks if user is active).

    Args:
        current_user: Current user from authentication

    Returns:
        Active user information

    Raises:
        HTTPException: If user is not active
    """
    # TODO: Check if user is active in database
    # For now, assume active

    return current_user


def require_permission(permission: str):
    """
    Dependency to require specific permission.

    Args:
        permission: Required permission

    Returns:
        Dependency function
    """
    async def permission_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        """Check if user has required permission."""
        # TODO: Check permissions from database
        # For now, check role
        if current_user.get("role") not in ["admin", "owner"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )

        return current_user

    return permission_checker
