"""Authentication endpoints."""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from klyntos_guard.api.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    APIKeyRequest,
    APIKeyResponse,
)
from klyntos_guard.api.dependencies import get_current_user
from klyntos_guard.db import get_db

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.

    Args:
        request: Registration request
        db: Database session

    Returns:
        Created user information

    Raises:
        HTTPException: If registration fails
    """
    try:
        # TODO: Implement user registration
        # 1. Check if email already exists
        # 2. Hash password
        # 3. Create tenant if tenant_name provided
        # 4. Create user
        # 5. Return user info

        logger.info("user_registration_started", email=request.email)

        # Mock response
        return UserResponse(
            id="user123",
            email=request.email,
            full_name=request.full_name,
            tenant_id="tenant123",
            role="admin",
            is_active=True,
            permissions=["read", "write"],
        )

    except Exception as e:
        logger.error("registration_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    User login.

    Args:
        request: Login request
        db: Database session

    Returns:
        JWT access token

    Raises:
        HTTPException: If login fails
    """
    try:
        # TODO: Implement login
        # 1. Find user by email
        # 2. Verify password
        # 3. Generate JWT token
        # 4. Update last_login
        # 5. Return token

        logger.info("user_login_attempt", email=request.email)

        # Mock response
        return TokenResponse(
            access_token="mock_jwt_token_here",
            token_type="bearer",
            expires_in=86400,  # 24 hours
        )

    except Exception as e:
        logger.error("login_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
):
    """
    Get current user information.

    Args:
        current_user: Authenticated user

    Returns:
        User information
    """
    # TODO: Fetch full user info from database
    return UserResponse(
        id=current_user["user_id"],
        email=current_user.get("email", "user@example.com"),
        full_name="John Doe",
        tenant_id=current_user["tenant_id"],
        role=current_user.get("role", "member"),
        is_active=True,
        permissions=["read"],
    )


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    request: APIKeyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new API key.

    Args:
        request: API key creation request
        current_user: Authenticated user
        db: Database session

    Returns:
        Created API key (only shown once!)
    """
    try:
        # TODO: Implement API key creation
        # 1. Generate random API key
        # 2. Hash the key
        # 3. Store in database
        # 4. Return key (only time it's shown in plain text)

        logger.info(
            "api_key_creation",
            user_id=current_user["user_id"],
            name=request.name,
        )

        # Mock response
        return APIKeyResponse(
            id="key123",
            name=request.name,
            key="kg_live_1234567890abcdef",  # Only shown once!
            key_prefix="kg_live_123",
            scopes=request.scopes,
            created_at="2025-01-01T12:00:00Z",
        )

    except Exception as e:
        logger.error("api_key_creation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key creation failed: {str(e)}",
        )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Revoke an API key.

    Args:
        key_id: API key ID to revoke
        current_user: Authenticated user
        db: Database session

    Returns:
        Success message
    """
    # TODO: Implement API key revocation
    # 1. Find API key
    # 2. Check ownership
    # 3. Mark as inactive
    # 4. Return success

    return {"success": True, "message": f"API key {key_id} revoked"}
