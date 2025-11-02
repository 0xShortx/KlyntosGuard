"""
KlyntosGuard CLI - Main Command Interface
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress
from rich import print as rprint

from .commands import scan, auth, config, report, chat
from . import __version__

console = Console()


@click.group()
@click.version_option(version=__version__, prog_name="kg")
@click.pass_context
def cli(ctx):
    """
    🛡️  KlyntosGuard - AI-Powered Code Security Scanner

    Detect vulnerabilities before they reach production.
    Powered by Claude 3 Opus.
    """
    ctx.ensure_object(dict)


# Register command groups
cli.add_command(scan.scan)
cli.add_command(auth.auth)
cli.add_command(config.config)
cli.add_command(report.report)
cli.add_command(chat.chat)


if __name__ == "__main__":
    cli()
