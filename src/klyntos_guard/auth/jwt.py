"""JWT token generation and verification."""

from datetime import datetime, timedelta
from typing import Dict, Optional

from jose import JWTError, jwt
from pydantic import BaseModel

from klyntos_guard.core.config import settings


class TokenData(BaseModel):
    """Token payload data."""

    user_id: str
    email: str
    tenant_id: str
    role: str


def create_access_token(
    user_id: str,
    email: str,
    tenant_id: str,
    role: str = "member",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT access token.

    Args:
        user_id: User ID
        email: User email
        tenant_id: Tenant ID
        role: User role
        expires_delta: Token expiration time

    Returns:
        JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)

    to_encode = {
        "sub": user_id,
        "email": email,
        "tenant_id": tenant_id,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """
    Verify and decode JWT token.

    Args:
        token: JWT token string

    Returns:
        TokenData with user information

    Raises:
        JWTError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        tenant_id: str = payload.get("tenant_id")
        role: str = payload.get("role", "member")

        if not user_id or not email:
            raise JWTError("Invalid token payload")

        return TokenData(
            user_id=user_id,
            email=email,
            tenant_id=tenant_id,
            role=role,
        )

    except JWTError as e:
        raise JWTError(f"Token verification failed: {str(e)}")
