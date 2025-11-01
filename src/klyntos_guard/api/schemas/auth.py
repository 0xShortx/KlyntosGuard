"""Authentication API schemas."""

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request."""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")


class RegisterRequest(BaseModel):
    """Registration request."""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    full_name: str = Field(..., description="Full name")
    tenant_name: Optional[str] = Field(None, description="Organization name")


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")


class UserResponse(BaseModel):
    """User information response."""

    id: str
    email: str
    full_name: str
    tenant_id: str
    role: str
    is_active: bool
    permissions: List[str]


class APIKeyRequest(BaseModel):
    """Request to create API key."""

    name: str = Field(..., description="API key name")
    scopes: List[str] = Field(
        default_factory=list,
        description="API key scopes"
    )


class APIKeyResponse(BaseModel):
    """API key response."""

    id: str
    name: str
    key: str = Field(..., description="API key (only shown once)")
    key_prefix: str
    scopes: List[str]
    created_at: str
