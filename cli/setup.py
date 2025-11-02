"""
KlyntosGuard CLI - AI-Powered Code Security Scanner
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="klyntos-guard",
    version="1.0.0",
    author="Klyntos",
    author_email="support@klyntos.com",
    description="AI-powered code security analysis tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/0xShortx/KlyntosGuard",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Security",
        "Topic :: Software Development :: Quality Assurance",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "click>=8.0.0",
        "requests>=2.28.0",
        "rich>=13.0.0",
        "pyyaml>=6.0",
        "python-dotenv>=1.0.0",
        "pathspec>=0.11.0",
    ],
    entry_points={
        "console_scripts": [
            "kg=klyntos_guard.cli:cli",
        ],
    },
)
