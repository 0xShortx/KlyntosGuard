"""Database models for KlyntosGuard."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class Tenant(Base):
    """Multi-tenancy model for organizations."""

    __tablename__ = "tenants"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)

    # Subscription info
    subscription_tier = Column(String(50), default="free")  # free, starter, pro, enterprise
    subscription_status = Column(String(50), default="active")  # active, canceled, past_due
    stripe_customer_id = Column(String(100), unique=True, index=True)
    stripe_subscription_id = Column(String(100), unique=True, index=True)

    # Quotas
    monthly_request_quota = Column(Integer, default=1000)
    monthly_requests_used = Column(Integer, default=0)

    # Settings
    settings = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), ForeignKey("tenants.id"), nullable=False, index=True)

    # User info
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(200))
    hashed_password = Column(String(255), nullable=False)

    # Status
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)

    # Role-based access control
    role = Column(String(50), default="member")  # admin, developer, member, auditor
    permissions = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")


class APIKey(Base):
    """API keys for authentication."""

    __tablename__ = "api_keys"

    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)

    # Key info
    name = Column(String(200), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True, index=True)
    key_prefix = Column(String(20))  # For display purposes (e.g., "kg_live_abc...")

    # Status
    is_active = Column(Boolean, default=True)

    # Permissions and limits
    scopes = Column(JSON, default=list)  # List of allowed scopes
    rate_limit = Column(Integer)  # Requests per minute (None = tenant default)

    # Usage tracking
    last_used_at = Column(DateTime)
    usage_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime)

    # Relationships
    tenant = relationship("Tenant", back_populates="api_keys")
    user = relationship("User", back_populates="api_keys")


class Subscription(Base):
    """Subscription history and events."""

    __tablename__ = "subscriptions"

    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), ForeignKey("tenants.id"), nullable=False, index=True)

    # Stripe info
    stripe_subscription_id = Column(String(100), unique=True, index=True)
    stripe_customer_id = Column(String(100), index=True)
    stripe_price_id = Column(String(100))

    # Subscription details
    tier = Column(String(50), nullable=False)  # starter, pro, enterprise
    status = Column(String(50), nullable=False)  # active, canceled, past_due, etc.

    # Billing
    amount = Column(Float)  # Monthly amount in dollars
    currency = Column(String(10), default="usd")
    billing_cycle = Column(String(20), default="monthly")  # monthly, yearly

    # Dates
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    canceled_at = Column(DateTime)

    # Metadata
    metadata = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="subscriptions")


class AuditLog(Base):
    """Audit logs for compliance and tracking."""

    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), ForeignKey("tenants.id"), index=True)

    # Event info
    event_type = Column(String(100), nullable=False, index=True)
    user_id = Column(String(50), index=True)
    session_id = Column(String(100), index=True)

    # Guardrail info
    rail_name = Column(String(100), index=True)
    rail_type = Column(String(50))  # input, output, dialog, etc.
    status = Column(String(50), nullable=False, index=True)  # passed, blocked, warning, error

    # Content (may be redacted)
    input_text = Column(Text)
    output_text = Column(Text)

    # Violations and metadata
    violations = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)

    # Performance
    processing_time_ms = Column(Float)

    # Timestamps
    timestamp = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")


class Usage(Base):
    """Usage tracking and billing."""

    __tablename__ = "usage"

    id = Column(String(50), primary_key=True)
    tenant_id = Column(String(50), ForeignKey("tenants.id"), nullable=False, index=True)

    # Period
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False)

    # Counts
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    blocked_requests = Column(Integer, default=0)
    error_requests = Column(Integer, default=0)

    # Token usage (for LLM calls)
    total_tokens = Column(Integer, default=0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)

    # Costs (estimated)
    estimated_cost = Column(Float, default=0.0)

    # Breakdown by rail
    rail_usage = Column(JSON, default=dict)  # {rail_name: count}

    # Breakdown by LLM provider
    llm_usage = Column(JSON, default=dict)  # {provider: {model: count}}

    # Metadata
    metadata = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
