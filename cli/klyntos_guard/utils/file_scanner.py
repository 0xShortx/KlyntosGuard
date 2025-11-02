"""
File scanner utilities
Handles recursive directory scanning with .gitignore support
"""

import os
from pathlib import Path
from typing import List, Set
import pathspec

# File extensions for supported languages
SUPPORTED_EXTENSIONS = {
    '.py': 'python',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.java': 'java',
    '.go': 'go',
    '.php': 'php',
    '.rb': 'ruby',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
}

# Default exclusions
DEFAULT_EXCLUDE_PATTERNS = [
    'node_modules/**',
    'venv/**',
    'env/**',
    '.venv/**',
    '__pycache__/**',
    '*.pyc',
    '.git/**',
    '.svn/**',
    '.hg/**',
    'dist/**',
    'build/**',
    '*.min.js',
    '*.min.css',
    'vendor/**',
    'bower_components/**',
    '.idea/**',
    '.vscode/**',
    '*.log',
    '.DS_Store',
]


def scan_directory(directory: Path, exclude: List[str] = None, max_file_size: int = 1024 * 1024) -> List[Path]:
    """
    Recursively scan directory for code files

    Args:
        directory: Path to scan
        exclude: Additional exclusion patterns
        max_file_size: Maximum file size in bytes (default 1MB)

    Returns:
        List of Path objects to scan
    """

    # Combine default and custom exclusions
    all_exclusions = DEFAULT_EXCLUDE_PATTERNS.copy()
    if exclude:
        all_exclusions.extend(exclude)

    # Load .gitignore if present
    gitignore_path = directory / '.gitignore'
    if gitignore_path.exists():
        gitignore_patterns = load_gitignore(gitignore_path)
        all_exclusions.extend(gitignore_patterns)

    # Create pathspec for exclusions
    spec = pathspec.PathSpec.from_lines('gitwildmatch', all_exclusions)

    files_to_scan = []

    for root, dirs, files in os.walk(directory):
        root_path = Path(root)

        # Check if directory should be excluded
        rel_root = root_path.relative_to(directory)
        if spec.match_file(str(rel_root)):
            dirs.clear()  # Don't descend into excluded directories
            continue

        for file_name in files:
            file_path = root_path / file_name
            rel_path = file_path.relative_to(directory)

            # Check exclusions
            if spec.match_file(str(rel_path)):
                continue

            # Check if supported extension
            if file_path.suffix not in SUPPORTED_EXTENSIONS:
                continue

            # Check file size
            try:
                if file_path.stat().st_size > max_file_size:
                    continue
            except OSError:
                continue

            files_to_scan.append(file_path)

    return sorted(files_to_scan)


def load_gitignore(gitignore_path: Path) -> List[str]:
    """
    Load patterns from .gitignore file
    """
    patterns = []

    try:
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#'):
                    patterns.append(line)
    except Exception:
        pass

    return patterns


def get_file_language(file_path: Path) -> str:
    """
    Detect programming language from file extension
    """
    ext = file_path.suffix.lower()
    return SUPPORTED_EXTENSIONS.get(ext, 'unknown')


def is_text_file(file_path: Path) -> bool:
    """
    Check if file is a text file (not binary)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Try to read first 512 bytes
            f.read(512)
        return True
    except (UnicodeDecodeError, OSError):
        return False


def get_file_stats(directory: Path) -> dict:
    """
    Get statistics about files in directory
    """
    files = scan_directory(directory)

    stats = {
        'total_files': len(files),
        'by_language': {},
        'total_size': 0
    }

    for file_path in files:
        lang = get_file_language(file_path)
        stats['by_language'][lang] = stats['by_language'].get(lang, 0) + 1

        try:
            stats['total_size'] += file_path.stat().st_size
        except OSError:
            pass

    return stats
