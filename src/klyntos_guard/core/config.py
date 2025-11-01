"""Configuration management for KlyntosGuard."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from klyntos_guard.core.types import RailConfig, RailType


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",
    )

    # Application
    app_name: str = "KlyntosGuard"
    app_env: str = "development"
    app_debug: bool = False
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_domain: str = "guard.klyntos.com"

    # Security
    secret_key: str = Field(default="change-me-in-production")
    jwt_secret: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    cors_origins: str = "http://localhost:3000"

    # Database
    database_url: str = "sqlite:///./klyntos_guard.db"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 3600

    # LLM Providers
    openai_api_key: Optional[str] = None
    openai_org_id: Optional[str] = None
    openai_default_model: str = "gpt-4"

    anthropic_api_key: Optional[str] = None
    anthropic_default_model: str = "claude-3-opus-20240229"

    google_api_key: Optional[str] = None
    google_default_model: str = "gemini-pro"

    # Azure OpenAI
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_version: str = "2024-02-15-preview"
    azure_openai_deployment_name: Optional[str] = None

    # Monitoring
    log_level: str = "INFO"
    sentry_dsn: Optional[str] = None
    prometheus_enabled: bool = True

    # Feature Flags
    enable_websockets: bool = True
    enable_metrics: bool = True
    enable_audit_logging: bool = True
    enable_multi_tenancy: bool = True

    # Content Safety
    toxicity_threshold: float = 0.8
    pii_detection_enabled: bool = True
    fact_checking_enabled: bool = True

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Plugins
    plugin_directory: str = "./plugins"
    enable_custom_plugins: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.app_env.lower() == "production"


class GuardrailsConfig:
    """Configuration for the guardrails engine."""

    def __init__(self, config_path: Optional[str] = None, config_dict: Optional[Dict] = None):
        """
        Initialize guardrails configuration.

        Args:
            config_path: Path to YAML configuration file
            config_dict: Configuration dictionary (overrides file)
        """
        self.config_data: Dict[str, Any] = {}
        self.rails: List[RailConfig] = []

        if config_path:
            self.load_from_file(config_path)
        elif config_dict:
            self.config_data = config_dict

        self._parse_rails()

    def load_from_file(self, config_path: str) -> None:
        """Load configuration from YAML file."""
        path = Path(config_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with path.open("r") as f:
            self.config_data = yaml.safe_load(f) or {}

    def _parse_rails(self) -> None:
        """Parse rail configurations from config data."""
        self.rails = []

        # Parse input rails
        for rail_data in self.config_data.get("input_rails", []):
            self.rails.append(
                RailConfig(
                    name=rail_data["name"],
                    type=RailType.INPUT,
                    enabled=rail_data.get("enabled", True),
                    priority=rail_data.get("priority", 100),
                    config=rail_data.get("config", {}),
                    description=rail_data.get("description"),
                )
            )

        # Parse output rails
        for rail_data in self.config_data.get("output_rails", []):
            self.rails.append(
                RailConfig(
                    name=rail_data["name"],
                    type=RailType.OUTPUT,
                    enabled=rail_data.get("enabled", True),
                    priority=rail_data.get("priority", 100),
                    config=rail_data.get("config", {}),
                    description=rail_data.get("description"),
                )
            )

        # Parse dialog rails
        for rail_data in self.config_data.get("dialog_rails", []):
            self.rails.append(
                RailConfig(
                    name=rail_data["name"],
                    type=RailType.DIALOG,
                    enabled=rail_data.get("enabled", True),
                    priority=rail_data.get("priority", 100),
                    config=rail_data.get("config", {}),
                    description=rail_data.get("description"),
                )
            )

        # Parse retrieval rails
        for rail_data in self.config_data.get("retrieval_rails", []):
            self.rails.append(
                RailConfig(
                    name=rail_data["name"],
                    type=RailType.RETRIEVAL,
                    enabled=rail_data.get("enabled", True),
                    priority=rail_data.get("priority", 100),
                    config=rail_data.get("config", {}),
                    description=rail_data.get("description"),
                )
            )

        # Parse execution rails
        for rail_data in self.config_data.get("execution_rails", []):
            self.rails.append(
                RailConfig(
                    name=rail_data["name"],
                    type=RailType.EXECUTION,
                    enabled=rail_data.get("enabled", True),
                    priority=rail_data.get("priority", 100),
                    config=rail_data.get("config", {}),
                    description=rail_data.get("description"),
                )
            )

        # Sort by priority
        self.rails.sort(key=lambda x: x.priority)

    def get_rails_by_type(self, rail_type: RailType) -> List[RailConfig]:
        """Get all enabled rails of a specific type."""
        return [rail for rail in self.rails if rail.type == rail_type and rail.enabled]

    def get_llm_config(self) -> Dict[str, Any]:
        """Get LLM configuration."""
        return self.config_data.get("llm", {})

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return self.config_data


# Global settings instance
settings = Settings()
