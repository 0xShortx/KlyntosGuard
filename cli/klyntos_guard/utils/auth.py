"""
Authentication utilities for KlyntosGuard CLI
Handles API key storage and retrieval
"""

import os
import sys
import json
import keyring
from pathlib import Path
from typing import Optional

SERVICE_NAME = "klyntos-guard"
CONFIG_DIR = Path.home() / ".klyntos-guard"
CONFIG_FILE = CONFIG_DIR / "config.json"


def get_api_key() -> Optional[str]:
    """
    Get API key from:
    1. Environment variable (KLYNTOS_GUARD_API_KEY)
    2. Keychain
    3. Config file (~/.klyntos-guard/config.json)
    """

    # Try environment variable first
    api_key = os.getenv("KLYNTOS_GUARD_API_KEY")
    if api_key:
        return api_key

    # Try keychain
    try:
        api_key = keyring.get_password(SERVICE_NAME, "api_key")
        if api_key:
            return api_key
    except Exception:
        pass  # Keychain might not be available

    # Try config file
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('api_key')
        except Exception:
            pass

    return None


def save_api_key(api_key: str) -> bool:
    """
    Save API key to keychain and config file
    """
    success = False

    # Try to save to keychain
    try:
        keyring.set_password(SERVICE_NAME, "api_key", api_key)
        success = True
    except Exception as e:
        # Keychain might not be available, fall back to file
        pass

    # Always save to config file as backup
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    config = {}
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        except Exception:
            pass

    config['api_key'] = api_key

    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        os.chmod(CONFIG_FILE, 0o600)  # Make file readable only by user
        success = True
    except Exception as e:
        return False

    return success


def delete_api_key() -> bool:
    """
    Delete API key from keychain and config file
    """
    success = False

    # Delete from keychain
    try:
        keyring.delete_password(SERVICE_NAME, "api_key")
        success = True
    except Exception:
        pass

    # Delete from config file
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)

            if 'api_key' in config:
                del config['api_key']

            with open(CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=2)

            success = True
        except Exception:
            pass

    return success


def save_user_info(email: str, name: Optional[str] = None):
    """
    Save user information to config
    """
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    config = {}
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
        except Exception:
            pass

    config['email'] = email
    if name:
        config['name'] = name

    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)


def get_user_info() -> Optional[dict]:
    """
    Get stored user information
    """
    if not CONFIG_FILE.exists():
        return None

    try:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
            return {
                'email': config.get('email'),
                'name': config.get('name')
            }
    except Exception:
        return None


def validate_api_key(api_key: str) -> bool:
    """
    Validate API key format
    """
    return api_key.startswith('kg_') and len(api_key) > 10
