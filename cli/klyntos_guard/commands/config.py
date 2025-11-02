"""
Config Command - Configuration management
"""

import click
from pathlib import Path
from rich.console import Console
from rich.syntax import Syntax
from rich import print as rprint
import yaml

from ..utils.config import find_config_file, load_config, save_config, get_default_config, validate_config

console = Console()


@click.group()
def config():
    """
    ⚙️  Configuration management

    Manage .klyntosguard configuration files.
    """
    pass


@config.command('init')
@click.option('--force', is_flag=True, help='Overwrite existing config')
def init(force):
    """
    Initialize configuration file

    Creates .klyntosguard in current directory with default settings.

    Example:
      kg config init
    """

    config_path = Path.cwd() / '.klyntosguard'

    if config_path.exists() and not force:
        console.print(f"[yellow]⚠️  Config file already exists:[/yellow] {config_path}")
        console.print("Use --force to overwrite")
        raise click.Abort()

    # Get default config
    default_config = get_default_config()

    # Save to file
    try:
        save_config(default_config, config_path)
        console.print(f"[green]✓ Created config file:[/green] {config_path}")
        console.print("\n[cyan]Edit this file to customize your security settings.[/cyan]")
    except Exception as e:
        console.print(f"[red]❌ Error creating config: {e}[/red]")
        raise click.Abort()


@config.command('show')
@click.option('--path', is_flag=True, help='Show config file path only')
def show(path):
    """
    Show current configuration

    Displays the active .klyntosguard configuration.

    Example:
      kg config show
      kg config show --path
    """

    config_path = find_config_file()

    if not config_path:
        console.print("[yellow]⚠️  No config file found[/yellow]")
        console.print("\nRun: [cyan]kg config init[/cyan]")
        raise click.Abort()

    if path:
        console.print(str(config_path))
        return

    # Load and display config
    try:
        cfg = load_config(config_path)

        console.print(f"\n[bold cyan]Configuration:[/bold cyan] {config_path}\n")

        # Display as YAML with syntax highlighting
        yaml_content = yaml.dump(cfg, default_flow_style=False, sort_keys=False)
        syntax = Syntax(yaml_content, "yaml", theme="monokai", line_numbers=True)
        console.print(syntax)

    except Exception as e:
        console.print(f"[red]❌ Error reading config: {e}[/red]")
        raise click.Abort()


@config.command('validate')
@click.argument('config_file', type=click.Path(exists=True), required=False)
def validate_cmd(config_file):
    """
    Validate configuration file

    Checks .klyntosguard file for errors.

    Example:
      kg config validate
      kg config validate .klyntosguard
    """

    if config_file:
        config_path = Path(config_file)
    else:
        config_path = find_config_file()

    if not config_path:
        console.print("[yellow]⚠️  No config file found[/yellow]")
        raise click.Abort()

    # Load config
    try:
        cfg = load_config(config_path)
        if cfg is None:
            console.print(f"[red]❌ Failed to load config:[/red] {config_path}")
            console.print("Check YAML syntax")
            raise click.Abort()

    except Exception as e:
        console.print(f"[red]❌ Error loading config: {e}[/red]")
        raise click.Abort()

    # Validate
    is_valid, error_msg = validate_config(cfg)

    if is_valid:
        console.print(f"[green]✓ Configuration is valid:[/green] {config_path}")
    else:
        console.print(f"[red]❌ Invalid configuration:[/red] {error_msg}")
        raise click.Abort()


@config.command('set')
@click.argument('key')
@click.argument('value')
def set_value(key, value):
    """
    Set configuration value

    Updates a specific key in .klyntosguard.

    Example:
      kg config set policy strict
      kg config set severity.minimum high
    """

    config_path = find_config_file()
    if not config_path:
        console.print("[yellow]⚠️  No config file found[/yellow]")
        console.print("\nRun: [cyan]kg config init[/cyan]")
        raise click.Abort()

    # Load config
    cfg = load_config(config_path)
    if cfg is None:
        cfg = {}

    # Handle nested keys (e.g., severity.minimum)
    keys = key.split('.')
    current = cfg

    for k in keys[:-1]:
        if k not in current:
            current[k] = {}
        current = current[k]

    # Set value
    final_key = keys[-1]
    current[final_key] = value

    # Validate
    is_valid, error_msg = validate_config(cfg)
    if not is_valid:
        console.print(f"[red]❌ Invalid value: {error_msg}[/red]")
        raise click.Abort()

    # Save
    try:
        save_config(cfg, config_path)
        console.print(f"[green]✓ Updated {key} = {value}[/green]")
    except Exception as e:
        console.print(f"[red]❌ Error saving config: {e}[/red]")
        raise click.Abort()
