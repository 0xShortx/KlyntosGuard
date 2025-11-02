"""Real authentication endpoints with JWT and database."""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify
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
from klyntos_guard.auth import create_access_token, hash_password, verify_password
from klyntos_guard.db import get_db, User, Tenant, APIKey

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    try:
        # Check if email exists
        result = await db.execute(select(User).where(User.email == request.email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create tenant
        tenant_name = request.tenant_name or f"{request.full_name}'s Organization"
        tenant = Tenant(
            id=str(uuid.uuid4()),
            name=tenant_name,
            slug=slugify(tenant_name),
            email=request.email,
            subscription_tier="free",
            subscription_status="active",
            monthly_request_quota=1000,
        )
        db.add(tenant)

        # Create user
        user = User(
            id=str(uuid.uuid4()),
            tenant_id=tenant.id,
            email=request.email,
            full_name=request.full_name,
            hashed_password=hash_password(request.password),
            is_active=True,
            role="admin",  # First user is admin
        )
        db.add(user)

        await db.commit()
        await db.refresh(user)

        logger.info("user_registered", user_id=user.id, email=user.email)

        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            tenant_id=user.tenant_id,
            role=user.role,
            is_active=user.is_active,
            permissions=user.permissions or [],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("registration_failed", error=str(e), exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """User login with JWT."""
    try:
        # Find user by email
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Verify password
        if not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()

        # Create JWT token
        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            tenant_id=user.tenant_id,
            role=user.role,
        )

        logger.info("user_logged_in", user_id=user.id, email=user.email)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=86400,  # 24 hours
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information."""
    result = await db.execute(select(User).where(User.id == current_user["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        tenant_id=user.tenant_id,
        role=user.role,
        is_active=user.is_active,
        permissions=user.permissions or [],
    )


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    request: APIKeyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key."""
    try:
        # Generate API key
        key_value = f"kg_live_{uuid.uuid4().hex}"
        key_hash = hash_password(key_value)

        # Create API key record
        api_key = APIKey(
            id=str(uuid.uuid4()),
            tenant_id=current_user["tenant_id"],
            user_id=current_user["user_id"],
            name=request.name,
            key_hash=key_hash,
            key_prefix=key_value[:12],
            scopes=request.scopes,
            is_active=True,
        )

        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)

        logger.info("api_key_created", key_id=api_key.id, user_id=current_user["user_id"])

        return APIKeyResponse(
            id=api_key.id,
            name=api_key.name,
            key=key_value,  # Only shown once!
            key_prefix=api_key.key_prefix,
            scopes=api_key.scopes,
            created_at=api_key.created_at.isoformat(),
        )

    except Exception as e:
        logger.error("api_key_creation_failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API key creation failed",
        )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an API key."""
    result = await db.execute(
        select(APIKey).where(
            APIKey.id == key_id,
            APIKey.tenant_id == current_user["tenant_id"],
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_active = False
    await db.commit()

    logger.info("api_key_revoked", key_id=key_id)

    return {"success": True, "message": "API key revoked"}
