"""Registry for guardrail implementations."""

from typing import Dict, Optional, Type

import structlog

from klyntos_guard.rails.base import BaseRail

logger = structlog.get_logger(__name__)


class RailRegistry:
    """
    Registry for managing guardrail implementations.

    Allows dynamic registration and retrieval of rail classes.
    """

    def __init__(self):
        """Initialize the registry."""
        self._rails: Dict[str, Type[BaseRail]] = {}

    def register(self, name: str, rail_class: Type[BaseRail]) -> None:
        """
        Register a rail class.

        Args:
            name: Name to register the rail under
            rail_class: The rail class to register

        Raises:
            ValueError: If a rail with this name is already registered
        """
        if name in self._rails:
            logger.warning(
                "rail_already_registered",
                name=name,
                existing_class=self._rails[name].__name__,
                new_class=rail_class.__name__,
            )
            # Allow override for now
            # raise ValueError(f"Rail '{name}' is already registered")

        self._rails[name] = rail_class
        logger.info("rail_registered", name=name, class_name=rail_class.__name__)

    def get(self, name: str) -> Optional[Type[BaseRail]]:
        """
        Get a registered rail class by name.

        Args:
            name: Name of the rail to retrieve

        Returns:
            The rail class, or None if not found
        """
        return self._rails.get(name)

    def list_rails(self) -> Dict[str, Type[BaseRail]]:
        """
        Get all registered rails.

        Returns:
            Dictionary mapping rail names to classes
        """
        return self._rails.copy()

    def unregister(self, name: str) -> bool:
        """
        Unregister a rail.

        Args:
            name: Name of the rail to unregister

        Returns:
            True if the rail was unregistered, False if it wasn't registered
        """
        if name in self._rails:
            del self._rails[name]
            logger.info("rail_unregistered", name=name)
            return True
        return False


# Global registry instance
_global_registry = RailRegistry()


def register_rail(name: str, rail_class: Type[BaseRail]) -> None:
    """
    Register a rail in the global registry.

    This is a convenience function for the decorator pattern.

    Args:
        name: Name to register the rail under
        rail_class: The rail class to register
    """
    _global_registry.register(name, rail_class)


def get_rail(name: str) -> Optional[Type[BaseRail]]:
    """
    Get a rail from the global registry.

    Args:
        name: Name of the rail to retrieve

    Returns:
        The rail class, or None if not found
    """
    return _global_registry.get(name)


def rail(name: str):
    """
    Decorator for registering rails.

    Usage:
        @rail("my_custom_rail")
        class MyCustomRail(BaseRail):
            ...
    """

    def decorator(rail_class: Type[BaseRail]) -> Type[BaseRail]:
        register_rail(name, rail_class)
        return rail_class

    return decorator
