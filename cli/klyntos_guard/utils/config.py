"""
Configuration file utilities
Handles .klyntosguard config files
"""

import yaml
import os
from pathlib import Path
from typing import Optional, Dict, Any

CONFIG_FILENAME = '.klyntosguard'


def find_config_file(start_path: Path = None) -> Optional[Path]:
    """
    Find .klyntosguard file by walking up directory tree
    """
    if start_path is None:
        start_path = Path.cwd()

    current = start_path.resolve()

    # Walk up directory tree
    while True:
        config_path = current / CONFIG_FILENAME
        if config_path.exists():
            return config_path

        parent = current.parent
        if parent == current:
            # Reached root
            break
        current = parent

    return None


def load_config(config_path: Path = None) -> Optional[Dict[str, Any]]:
    """
    Load configuration from .klyntosguard file
    """
    if config_path is None:
        config_path = find_config_file()

    if config_path is None:
        return None

    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            return config if config else {}
    except Exception as e:
        return None


def save_config(config: Dict[str, Any], config_path: Path = None):
    """
    Save configuration to .klyntosguard file
    """
    if config_path is None:
        config_path = Path.cwd() / CONFIG_FILENAME

    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)


def get_default_config() -> Dict[str, Any]:
    """
    Get default configuration template
    """
    return {
        'version': '1.0',
        'policy': 'moderate',
        'scan': {
            'recursive': True,
            'max_file_size': 10485760,  # 10MB
            'timeout': 300,
            'parallel_scans': 4
        },
        'severity': {
            'minimum': 'medium',
            'fail_on': 'critical'
        },
        'exclude': [
            'node_modules/**',
            'venv/**',
            '.git/**',
            '*.test.js',
            '*.spec.py',
            'test_*.py'
        ],
        'include': [
            '**/*.py',
            '**/*.js',
            '**/*.ts',
            '**/*.java',
            '**/*.go'
        ],
        'custom_rules': [],
        'ignore_vulnerabilities': []
    }


def validate_config(config: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Validate configuration structure

    Returns:
        (is_valid, error_message)
    """

    # Check required fields
    if 'policy' in config:
        if config['policy'] not in ['strict', 'moderate', 'lax']:
            return False, f"Invalid policy: {config['policy']}"

    if 'severity' in config:
        if 'minimum' in config['severity']:
            if config['severity']['minimum'] not in ['critical', 'high', 'medium', 'low', 'info']:
                return False, f"Invalid severity.minimum: {config['severity']['minimum']}"

        if 'fail_on' in config['severity']:
            if config['severity']['fail_on'] not in ['critical', 'high', 'medium', 'low']:
                return False, f"Invalid severity.fail_on: {config['severity']['fail_on']}"

    # Check exclude patterns are strings
    if 'exclude' in config:
        if not isinstance(config['exclude'], list):
            return False, "exclude must be a list"
        for pattern in config['exclude']:
            if not isinstance(pattern, str):
                return False, f"Invalid exclude pattern: {pattern}"

    # Check include patterns are strings
    if 'include' in config:
        if not isinstance(config['include'], list):
            return False, "include must be a list"
        for pattern in config['include']:
            if not isinstance(pattern, str):
                return False, f"Invalid include pattern: {pattern}"

    return True, None


def merge_config_with_env(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge configuration with environment variables
    Environment variables take precedence
    """

    merged = config.copy()

    # Override with environment variables
    if os.getenv('KLYNTOS_GUARD_POLICY'):
        merged['policy'] = os.getenv('KLYNTOS_GUARD_POLICY')

    if os.getenv('KLYNTOS_GUARD_API'):
        merged['api_url'] = os.getenv('KLYNTOS_GUARD_API')

    return merged
