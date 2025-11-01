"""Setup configuration for KlyntosGuard."""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

# Read requirements
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    requirements = [
        line.strip()
        for line in requirements_file.read_text().splitlines()
        if line.strip() and not line.startswith("#")
    ]

setup(
    name="klyntos-guard",
    version="0.1.0",
    description="Programmable AI Safety Guardrails and Compliance Platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Klyntos AI",
    author_email="guard@klyntos.com",
    url="https://github.com/0xShortx/KlyntosGuard",
    project_urls={
        "Documentation": "https://docs.klyntos.com/guard",
        "Source": "https://github.com/0xShortx/KlyntosGuard",
        "Tracker": "https://github.com/0xShortx/KlyntosGuard/issues",
    },
    license="MIT",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=8.3.4",
            "pytest-asyncio>=0.24.0",
            "pytest-cov>=6.0.0",
            "black>=24.10.0",
            "isort>=5.13.2",
            "flake8>=7.1.1",
            "mypy>=1.13.0",
        ],
        "docs": [
            "sphinx>=8.1.3",
            "sphinx-rtd-theme>=3.0.2",
        ],
    },
    entry_points={
        "console_scripts": [
            "klyntos-guard=klyntos_guard.cli.main:cli",
            "kg=klyntos_guard.cli.main:cli",  # Short alias
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    keywords="ai safety guardrails compliance llm openai anthropic",
    include_package_data=True,
    zip_safe=False,
)
