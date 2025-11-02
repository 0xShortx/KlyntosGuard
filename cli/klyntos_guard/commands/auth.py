"""
Auth Command - Authentication management
"""

import click
import requests
import webbrowser
from rich.console import Console
from rich.panel import Panel
from rich import print as rprint

from ..utils.auth import get_api_key, save_api_key, delete_api_key, get_user_info, save_user_info, validate_api_key

console = Console()

AUTH_URL = "https://guard.klyntos.com/settings/cli"
API_URL = "https://guard.klyntos.com/api/v1"


@click.group()
def auth():
    """
    🔐 Authentication management

    Manage API keys and user sessions.
    """
    pass


@auth.command('login')
@click.option('--api-key', help='API key to use')
def login(api_key):
    """
    Login to KlyntosGuard

    Opens browser for authentication or accepts API key directly.

    Examples:
      kg auth login
      kg auth login --api-key kg_xxxxx
    """

    if api_key:
        # Direct API key login
        if not validate_api_key(api_key):
            console.print("[red]❌ Invalid API key format[/red]")
            console.print("API keys should start with 'kg_'")
            raise click.Abort()

        # Verify API key works
        if verify_api_key(api_key):
            save_api_key(api_key)
            console.print("[green]✓ Authenticated successfully![/green]")
        else:
            console.print("[red]❌ Invalid API key[/red]")
            raise click.Abort()

    else:
        # Browser-based login
        console.print("\n[cyan]🔐 Opening browser for authentication...[/cyan]\n")
        console.print(f"If browser doesn't open, visit: {AUTH_URL}")

        try:
            webbrowser.open(AUTH_URL)
        except Exception:
            pass

        console.print("\n[yellow]After logging in:[/yellow]")
        console.print("1. Copy your API key from the dashboard")
        console.print("2. Paste it below\n")

        api_key = click.prompt("Enter your API key", hide_input=True)

        if not validate_api_key(api_key):
            console.print("[red]❌ Invalid API key format[/red]")
            raise click.Abort()

        if verify_api_key(api_key):
            save_api_key(api_key)
            console.print("\n[green]✓ Authenticated successfully![/green]")
        else:
            console.print("[red]❌ Invalid API key[/red]")
            raise click.Abort()


@auth.command('logout')
def logout():
    """
    Logout from KlyntosGuard

    Removes stored API key and credentials.
    """

    if delete_api_key():
        console.print("[green]✓ Logged out successfully[/green]")
    else:
        console.print("[yellow]⚠️  No active session found[/yellow]")


@auth.command('whoami')
def whoami():
    """
    Show current user information

    Displays logged-in user email and plan.
    """

    api_key = get_api_key()
    if not api_key:
        console.print("[red]❌ Not authenticated[/red]")
        console.print("Run: kg auth login")
        raise click.Abort()

    # Get user info from API
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.get(f"{API_URL}/user/me", headers=headers, timeout=10)
        response.raise_for_status()

        user_data = response.json()

        console.print("\n[bold cyan]Current User:[/bold cyan]\n")
        console.print(f"  Email: {user_data.get('email', 'Unknown')}")
        console.print(f"  Plan: {user_data.get('plan', 'Basic')}")
        console.print(f"  Scans Used: {user_data.get('scans_used', 0)} / {user_data.get('scans_limit', 10)}")
        console.print(f"  API Key: {api_key[:7]}...{api_key[-4:]}")
        console.print()

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            console.print("[red]❌ Invalid API key[/red]")
            console.print("Run: kg auth login")
        else:
            console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()


@auth.command('status')
def status():
    """
    Check authentication status

    Verifies API connection and key validity.
    """

    api_key = get_api_key()

    if not api_key:
        console.print("[red]❌ Not authenticated[/red]")
        console.print("\nRun: [cyan]kg auth login[/cyan]")
        raise click.Abort()

    console.print("\n[cyan]Checking authentication...[/cyan]\n")

    # Check API key format
    if not validate_api_key(api_key):
        console.print("[red]❌ Invalid API key format[/red]")
        raise click.Abort()

    # Verify with API
    if verify_api_key(api_key):
        console.print("[green]✓ Authenticated[/green]")
        console.print(f"[green]✓ API Key Valid[/green]")
        console.print(f"[green]✓ API Connection OK[/green]")
        console.print(f"\nAPI Key: {api_key[:7]}...{api_key[-4:]}")
    else:
        console.print("[red]❌ Invalid or expired API key[/red]")
        console.print("\nRun: [cyan]kg auth login[/cyan]")
        raise click.Abort()


def verify_api_key(api_key: str) -> bool:
    """
    Verify API key with the API
    """
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.get(f"{API_URL}/user/me", headers=headers, timeout=10)
        return response.status_code == 200
    except Exception:
        return False
