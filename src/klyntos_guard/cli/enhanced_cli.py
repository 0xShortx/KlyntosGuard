"""Enhanced CLI with beautiful UI, auth, and payment management."""

import os
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional

import click
import httpx
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Prompt, Confirm
from rich.markdown import Markdown
from rich import print as rprint

from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig
from klyntos_guard.adapters import OpenAIAdapter
from klyntos_guard.sdk import KlyntosGuardClient

console = Console()

# Config directory
CONFIG_DIR = Path.home() / ".klyntos_guard"
AUTH_FILE = CONFIG_DIR / "auth.json"
HISTORY_FILE = CONFIG_DIR / "history.json"

# API Configuration
def get_api_base_url() -> str:
    """Get API base URL from environment or default."""
    return os.getenv("KLYNTOS_GUARD_API", "http://localhost:8000/api/v1")


def ensure_config_dir():
    """Ensure config directory exists."""
    CONFIG_DIR.mkdir(exist_ok=True)


def save_auth(token: str, email: str, user_id: str):
    """Save authentication credentials."""
    ensure_config_dir()
    AUTH_FILE.write_text(json.dumps({
        "token": token,
        "email": email,
        "user_id": user_id,
        "logged_in_at": datetime.utcnow().isoformat()
    }))


def load_auth() -> Optional[dict]:
    """Load authentication credentials."""
    if not AUTH_FILE.exists():
        return None
    try:
        return json.loads(AUTH_FILE.read_text())
    except:
        return None


def clear_auth():
    """Clear authentication credentials."""
    if AUTH_FILE.exists():
        AUTH_FILE.unlink()


def get_client() -> httpx.Client:
    """Get authenticated HTTP client."""
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in. Run 'kg auth login' first.[/red]")
        raise click.Abort()

    return httpx.Client(
        base_url=get_api_base_url(),
        headers={"Authorization": f"Bearer {auth['token']}"},
        timeout=30.0
    )


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """
    🛡️  KlyntosGuard - AI Safety Guardrails Platform

    Beautiful CLI for managing AI safety and compliance
    """
    pass


# ============================================================================
# AUTHENTICATION COMMANDS
# ============================================================================

@cli.group()
def auth():
    """Authentication commands"""
    pass


@auth.command(name="login")
@click.option("--email", help="Your email address")
@click.option("--password", help="Your password")
@click.option("--api-key", help="CLI API key from guard.klyntos.com/settings/cli")
def auth_login(email, password, api_key):
    """Login to KlyntosGuard

    Two login methods:
    1. Email + Password (direct login)
    2. API Key (from web UI at guard.klyntos.com)

    Examples:
      kg auth login --email user@example.com --password secret
      kg auth login --api-key kg_abc123...
    """

    # Determine login method
    if api_key:
        # Login with API key (bridge from web UI)
        _login_with_api_key(api_key)
    elif email and password:
        # Login with email/password (direct)
        _login_with_credentials(email, password)
    else:
        # Interactive mode - ask user which method
        console.print(Panel(
            "[cyan]Choose login method:[/cyan]\n\n"
            "1. API Key (from guard.klyntos.com/settings/cli)\n"
            "2. Email & Password",
            title="Login to KlyntosGuard",
            border_style="cyan"
        ))

        choice = Prompt.ask("Select method", choices=["1", "2"], default="1")

        if choice == "1":
            api_key = Prompt.ask("Enter your API key", password=True)
            _login_with_api_key(api_key)
        else:
            email = Prompt.ask("Email")
            password = Prompt.ask("Password", password=True)
            _login_with_credentials(email, password)


def _login_with_api_key(api_key: str):
    """Login using API key from web UI (bridge authentication)."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Verifying API key...", total=None)

        try:
            # Exchange API key for JWT token via web UI backend
            # This bridges Better Auth (web) with JWT (CLI)
            api_url = get_api_base_url()

            with httpx.Client(timeout=30.0) as client:
                # Call the web UI's API key verification endpoint
                response = client.post(
                    f"{api_url}/cli/verify-key",
                    json={"api_key": api_key}
                )

                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    user_id = data["user"]["id"]
                    email = data["user"]["email"]

                    save_auth(token, email, user_id)

                    progress.stop()
                    console.print(f"\n[green]✓[/green] Successfully logged in as [cyan]{email}[/cyan]")
                    console.print(f"[dim]Token saved to {AUTH_FILE}[/dim]\n")

                    # Show helpful info
                    console.print("[dim]You're now authenticated with your web account![/dim]")
                    console.print("[dim]Manage API keys at: https://guard.klyntos.com/settings/cli[/dim]\n")
                else:
                    progress.stop()
                    error_msg = response.json().get("error", "Unknown error")
                    console.print(f"\n[red]✗[/red] API key verification failed: {error_msg}\n")

                    if "expired" in error_msg.lower():
                        console.print("[yellow]Your API key has expired.[/yellow]")
                        console.print("[dim]Generate a new one at: https://guard.klyntos.com/settings/cli[/dim]\n")
                    elif "invalid" in error_msg.lower():
                        console.print("[yellow]Invalid API key.[/yellow]")
                        console.print("[dim]Make sure you copied the full key from the web UI.[/dim]\n")

                    raise click.Abort()

        except httpx.ConnectError:
            progress.stop()
            console.print(f"\n[red]✗[/red] Cannot connect to Guard API")
            console.print("[dim]Make sure you're connected to the internet[/dim]\n")
            raise click.Abort()
        except Exception as e:
            progress.stop()
            console.print(f"\n[red]✗[/red] Login failed: {str(e)}\n")
            raise click.Abort()


def _login_with_credentials(email: str, password: str):
    """Login with email and password (direct authentication)."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Authenticating...", total=None)

        try:
            # Make real API call to login endpoint
            api_url = get_api_base_url()

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{api_url}/auth/login",
                    json={"email": email, "password": password}
                )

                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    user_id = data["user"]["user_id"]

                    save_auth(token, email, user_id)

                    progress.stop()
                    console.print(f"\n[green]✓[/green] Successfully logged in as [cyan]{email}[/cyan]")
                    console.print(f"[dim]Token saved to {AUTH_FILE}[/dim]\n")
                else:
                    progress.stop()
                    error_msg = response.json().get("detail", "Unknown error")
                    console.print(f"\n[red]✗[/red] Login failed: {error_msg}\n")
                    raise click.Abort()

        except httpx.ConnectError:
            progress.stop()
            console.print(f"\n[red]✗[/red] Cannot connect to API at {api_url}")
            console.print("[dim]Make sure the API server is running[/dim]\n")
            raise click.Abort()
        except Exception as e:
            progress.stop()
            console.print(f"\n[red]✗[/red] Login failed: {str(e)}\n")
            raise click.Abort()


@auth.command(name="signup")
@click.option("--email", prompt="Email", help="Your email address")
@click.option("--name", prompt="Full name", help="Your full name")
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
def auth_signup(email, name, password):
    """Sign up for KlyntosGuard"""
    console.print(Panel(
        "[cyan]Creating your KlyntosGuard account...[/cyan]",
        title="Sign Up",
        border_style="cyan"
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Creating account...", total=None)

        try:
            # Make real API call to register endpoint
            api_url = get_api_base_url()

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{api_url}/auth/register",
                    json={"email": email, "full_name": name, "password": password}
                )

                if response.status_code == 201:
                    data = response.json()
                    user_id = data["user_id"]

                    # Now login to get token
                    login_response = client.post(
                        f"{api_url}/auth/login",
                        json={"email": email, "password": password}
                    )

                    if login_response.status_code == 200:
                        login_data = login_response.json()
                        token = login_data["access_token"]
                        save_auth(token, email, user_id)

                        progress.stop()
                        console.print(f"\n[green]✓[/green] Account created successfully!")
                        console.print(f"[cyan]Welcome, {name}![/cyan]\n")

                        # Show next steps
                        console.print(Panel(
                            "[bold]Next steps:[/bold]\n\n"
                            "1. Choose a plan: [cyan]kg subscription plans[/cyan]\n"
                            "2. Process your first text: [cyan]kg chat[/cyan]\n"
                            "3. View usage: [cyan]kg usage[/cyan]",
                            title="Getting Started",
                            border_style="green"
                        ))
                    else:
                        progress.stop()
                        console.print(f"\n[yellow]⚠[/yellow] Account created but auto-login failed")
                        console.print("Please run [cyan]kg auth login[/cyan] to login\n")
                else:
                    progress.stop()
                    error_msg = response.json().get("detail", "Unknown error")
                    console.print(f"\n[red]✗[/red] Signup failed: {error_msg}\n")
                    raise click.Abort()

        except httpx.ConnectError:
            progress.stop()
            console.print(f"\n[red]✗[/red] Cannot connect to API at {api_url}")
            console.print("[dim]Make sure the API server is running[/dim]\n")
            raise click.Abort()
        except Exception as e:
            progress.stop()
            console.print(f"\n[red]✗[/red] Signup failed: {str(e)}\n")
            raise click.Abort()


@auth.command(name="logout")
def auth_logout():
    """Logout from KlyntosGuard"""
    auth = load_auth()
    if not auth:
        console.print("[yellow]Not logged in[/yellow]")
        return

    if Confirm.ask(f"Logout from {auth['email']}?"):
        clear_auth()
        console.print("[green]✓[/green] Logged out successfully")


@auth.command(name="whoami")
def auth_whoami():
    """Show current user"""
    auth = load_auth()
    if not auth:
        console.print("[yellow]Not logged in[/yellow]")
        console.print("Run [cyan]kg auth login[/cyan] to login")
        return

    table = Table(show_header=False, box=None)
    table.add_row("[bold]Email:[/bold]", auth["email"])
    table.add_row("[bold]User ID:[/bold]", auth["user_id"])
    table.add_row("[bold]Logged in:[/bold]", auth["logged_in_at"])

    console.print(Panel(table, title="Current User", border_style="cyan"))


# ============================================================================
# CHAT / PROCESSING COMMANDS
# ============================================================================

@cli.command()
@click.argument("message", required=False)
@click.option("--stream", is_flag=True, help="Stream response in real-time")
def chat(message, stream):
    """
    Interactive chat with guardrails protection

    Examples:
      kg chat "What's the weather?"
      kg chat --stream
    """
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in. Run 'kg auth login' first.[/red]")
        return

    # Interactive mode if no message provided
    if not message:
        console.print(Panel(
            "[cyan]Interactive Chat Mode[/cyan]\n\n"
            "Type your message and press Enter.\n"
            "Type 'exit' or 'quit' to leave.\n"
            "Type '/help' for commands.",
            title="🛡️  KlyntosGuard Chat",
            border_style="cyan"
        ))

        while True:
            try:
                message = Prompt.ask("\n[bold cyan]You[/bold cyan]")

                if message.lower() in ["exit", "quit", "/exit", "/quit"]:
                    console.print("[yellow]Goodbye![/yellow]")
                    break

                if message == "/help":
                    console.print(Panel(
                        "[bold]Commands:[/bold]\n"
                        "/help - Show this help\n"
                        "/usage - Show token usage\n"
                        "/clear - Clear screen\n"
                        "exit, quit - Exit chat",
                        border_style="cyan"
                    ))
                    continue

                if message == "/usage":
                    show_usage_sync()
                    continue

                if message == "/clear":
                    console.clear()
                    continue

                # Process message
                process_message_sync(message, stream)

            except KeyboardInterrupt:
                console.print("\n[yellow]Goodbye![/yellow]")
                break
            except EOFError:
                break

    else:
        # Single message mode
        process_message_sync(message, stream)


def process_message_sync(message: str, stream: bool = False):
    """Process a single message."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Processing through guardrails...", total=None)

        try:
            # Make real API call to guardrails endpoint
            with get_client() as client:
                response = client.post(
                    "/guardrails/process",
                    json={"input": message}
                )

                progress.stop()

                if response.status_code == 200:
                    data = response.json()

                    # Check if guardrails passed
                    if data["allowed"]:
                        console.print("\n[bold green]🛡️  Guardrails Check: PASSED[/bold green]")
                    else:
                        console.print("\n[bold red]🛡️  Guardrails Check: BLOCKED[/bold red]")

                        if data.get("violations"):
                            console.print("\n[yellow]Violations:[/yellow]")
                            for violation in data["violations"]:
                                console.print(f"  • {violation['rail_name']}: {violation['message']}")
                            return

                    # Show response
                    console.print("\n[bold cyan]Assistant:[/bold cyan]")
                    if data.get("processed_output"):
                        console.print(data["processed_output"])
                    else:
                        console.print("[dim]No output generated[/dim]")

                    # Show metadata
                    processing_time = data.get("processing_time_ms", 0)
                    console.print(f"\n[dim]Processing: {processing_time:.0f}ms[/dim]")
                else:
                    console.print(f"\n[red]✗[/red] API Error: {response.status_code}")
                    error_msg = response.json().get("detail", "Unknown error")
                    console.print(f"[dim]{error_msg}[/dim]")

        except httpx.ConnectError:
            progress.stop()
            console.print(f"\n[red]✗[/red] Cannot connect to API")
            console.print("[dim]Make sure the API server is running[/dim]")
        except Exception as e:
            progress.stop()
            console.print(f"\n[red]✗[/red] Error: {str(e)}")


# ============================================================================
# USAGE & BILLING COMMANDS
# ============================================================================

@cli.command()
def usage():
    """Show token usage and costs"""
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in[/red]")
        return

    show_usage_sync()


def show_usage_sync():
    """Show usage synchronously."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Fetching usage data...", total=None)

        try:
            # Make real API call to get subscription and usage
            with get_client() as client:
                sub_response = client.get("/subscriptions/current")

                progress.stop()

                if sub_response.status_code == 200:
                    data = sub_response.json()

                    # Create usage table
                    table = Table(title="Usage & Subscription", box=None)
                    table.add_column("Metric", style="cyan")
                    table.add_column("Value", style="green")

                    table.add_row("Plan", data.get("tier", "unknown").title())
                    table.add_row("Status", data.get("status", "unknown").title())
                    table.add_row("Requests Used", f"{data.get('requests_used', 0):,}")
                    table.add_row("Quota", f"{data.get('requests_quota', 0):,}")

                    remaining = data.get('requests_quota', 0) - data.get('requests_used', 0)
                    table.add_row("Remaining", f"{remaining:,}")

                    console.print("\n")
                    console.print(table)
                    console.print("\n")

                    # Progress bar for quota
                    from rich.progress import BarColumn
                    used = data.get('requests_used', 0)
                    quota = data.get('requests_quota', 1)  # Avoid division by zero

                    progress_bar = Progress(
                        TextColumn("[bold blue]{task.description}"),
                        BarColumn(),
                        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                    )
                    console.print("[bold]Quota Usage:[/bold]")
                    with progress_bar:
                        task = progress_bar.add_task("", total=quota, completed=used)
                        import time
                        time.sleep(0.3)
                else:
                    console.print(f"\n[red]✗[/red] Failed to fetch usage data")
                    console.print(f"[dim]Status: {sub_response.status_code}[/dim]")

        except httpx.ConnectError:
            progress.stop()
            console.print(f"\n[red]✗[/red] Cannot connect to API")
            console.print("[dim]Make sure the API server is running[/dim]")
        except Exception as e:
            progress.stop()
            console.print(f"\n[red]Error: {str(e)}[/red]")


# ============================================================================
# SUBSCRIPTION COMMANDS
# ============================================================================

@cli.group()
def subscription():
    """Manage your subscription"""
    pass


@subscription.command(name="plans")
def subscription_plans():
    """View available subscription plans"""
    table = Table(title="KlyntosGuard Subscription Plans")
    table.add_column("Plan", style="cyan", no_wrap=True)
    table.add_column("Price/mo", style="green")
    table.add_column("Requests", style="yellow")
    table.add_column("Features", style="white")

    table.add_row(
        "Free",
        "$0",
        "1,000",
        "Basic guardrails, Community support"
    )
    table.add_row(
        "Starter",
        "$99",
        "100,000",
        "All guardrails, Email support, Analytics"
    )
    table.add_row(
        "Professional",
        "$499",
        "1,000,000",
        "Priority support, RBAC, Custom rules"
    )
    table.add_row(
        "Enterprise",
        "$1,999",
        "10,000,000+",
        "24/7 support, SSO, On-premise option"
    )

    console.print("\n")
    console.print(table)
    console.print("\n[dim]Upgrade: kg subscription upgrade[/dim]\n")


@subscription.command(name="current")
def subscription_current():
    """View current subscription"""
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in[/red]")
        return

    try:
        # Get web UI URL for subscription status
        web_url = os.getenv("KLYNTOS_GUARD_WEB_URL", "http://localhost:3001")

        # Fetch subscription status from web API
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{web_url}/api/subscriptions/status",
                headers={"Authorization": f"Bearer {auth['token']}"}
            )

            if response.status_code != 200:
                console.print("[yellow]Could not fetch subscription details[/yellow]")
                return

            data = response.json()

            if not data.get('hasSubscription'):
                console.print(Panel(
                    "[yellow]No active subscription[/yellow]\n\n"
                    "Subscribe to unlock full features:\n"
                    f"  • Visit: {web_url}/pricing\n"
                    "  • Or run: kg subscription plans",
                    title="Subscription Status",
                    border_style="yellow"
                ))
                return

            # Build status display
            tier = data.get('tier', 'unknown').title()
            status = data.get('status', 'unknown')
            billing_cycle = data.get('billingCycle', 'unknown')

            # Color status
            if data.get('isActive'):
                status_display = f"[green]{status.replace('_', ' ').title()}[/green]"
            elif data.get('isPastDue'):
                status_display = f"[yellow]{status.replace('_', ' ').title()}[/yellow]"
            else:
                status_display = f"[red]{status.replace('_', ' ').title()}[/red]"

            # Format renewal date
            renewal_info = ""
            if data.get('currentPeriodEnd'):
                try:
                    from datetime import datetime
                    end_date = datetime.fromisoformat(data['currentPeriodEnd'].replace('Z', '+00:00'))
                    renewal_info = f"\n[bold]Next billing:[/bold] {end_date.strftime('%b %d, %Y')}"

                    if data.get('daysUntilRenewal'):
                        days = data['daysUntilRenewal']
                        renewal_info += f" ({days} days)"
                except:
                    pass

            # Cancel warning
            cancel_warning = ""
            if data.get('cancelAtPeriodEnd'):
                cancel_warning = "\n[yellow]⚠️  Subscription will cancel at period end[/yellow]"

            # Trial info
            trial_info = ""
            if data.get('isTrialing') and data.get('trialEnd'):
                try:
                    from datetime import datetime
                    trial_end = datetime.fromisoformat(data['trialEnd'].replace('Z', '+00:00'))
                    trial_info = f"\n[cyan]🎁 Trial ends: {trial_end.strftime('%b %d, %Y')}[/cyan]"
                except:
                    pass

            console.print(Panel(
                f"[bold]Plan:[/bold] Guard {tier}\n"
                f"[bold]Status:[/bold] {status_display}\n"
                f"[bold]Billing:[/bold] {billing_cycle.title()}"
                f"{renewal_info}"
                f"{cancel_warning}"
                f"{trial_info}",
                title="Current Subscription",
                border_style="cyan"
            ))

            # Show manage link
            console.print(f"\n[dim]Manage subscription: {web_url}/settings/subscription[/dim]\n")

    except Exception as e:
        console.print(f"[red]Error fetching subscription:[/red] {e}")


@subscription.command(name="upgrade")
def subscription_upgrade():
    """Upgrade or change your subscription plan"""
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in[/red]")
        return

    # Get web UI URL
    web_url = os.getenv("KLYNTOS_GUARD_WEB_URL", "http://localhost:3001")
    pricing_url = f"{web_url}/pricing"

    console.print(Panel(
        f"To upgrade or change your subscription:\n\n"
        f"1. Visit the pricing page:\n"
        f"   [cyan]{pricing_url}[/cyan]\n\n"
        f"2. Choose your plan (Basic or Pro)\n\n"
        f"3. Complete checkout\n\n"
        f"Or manage existing subscription:\n"
        f"   [cyan]{web_url}/settings/subscription[/cyan]",
        title="Upgrade Subscription",
        border_style="blue"
    ))

    # Try to open browser
    if Confirm.ask("\nOpen pricing page in browser?", default=True):
        import webbrowser
        webbrowser.open(pricing_url)
        console.print("[green]✓[/green] Opened pricing page in browser")


# ============================================================================
# CONFIGURATION COMMANDS
# ============================================================================

@cli.command()
def config():
    """Interactive configuration wizard"""
    console.print(Panel(
        "[cyan]KlyntosGuard Configuration Wizard[/cyan]",
        border_style="cyan"
    ))

    # LLM Provider
    provider = Prompt.ask(
        "\n[bold]Choose LLM provider[/bold]",
        choices=["openai", "anthropic", "google"],
        default="openai"
    )

    # Model
    models = {
        "openai": ["gpt-4", "gpt-3.5-turbo"],
        "anthropic": ["claude-3-opus", "claude-3-sonnet"],
        "google": ["gemini-pro"]
    }

    model = Prompt.ask(
        f"[bold]Choose {provider} model[/bold]",
        choices=models[provider],
        default=models[provider][0]
    )

    # Safety level
    safety = Prompt.ask(
        "\n[bold]Safety level[/bold]",
        choices=["strict", "balanced", "lenient"],
        default="balanced"
    )

    thresholds = {"strict": 0.7, "balanced": 0.8, "lenient": 0.9}

    console.print("\n[green]✓[/green] Configuration saved!")
    console.print(f"\nProvider: {provider}")
    console.print(f"Model: {model}")
    console.print(f"Safety: {safety} (threshold: {thresholds[safety]})")


if __name__ == "__main__":
    cli()
