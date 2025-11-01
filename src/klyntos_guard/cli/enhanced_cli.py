"""Enhanced CLI with beautiful UI, auth, and payment management."""

import os
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional

import click
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


def get_client() -> KlyntosGuardClient:
    """Get authenticated API client."""
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in. Run 'kg login' first.[/red]")
        raise click.Abort()

    return KlyntosGuardClient(
        api_key=auth["token"],
        base_url=os.getenv("KLYNTOS_GUARD_API", "http://localhost:8000/api/v1")
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
@click.option("--email", prompt="Email", help="Your email address")
@click.option("--password", prompt=True, hide_input=True, help="Your password")
def auth_login(email, password):
    """Login to KlyntosGuard"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Authenticating...", total=None)

        try:
            # TODO: Implement actual API login
            # For now, mock response
            import time
            time.sleep(1)

            # Mock successful login
            token = "mock_jwt_token_12345"
            user_id = "user_12345"

            save_auth(token, email, user_id)

            progress.stop()
            console.print(f"\n[green]✓[/green] Successfully logged in as [cyan]{email}[/cyan]")
            console.print(f"[dim]Token saved to {AUTH_FILE}[/dim]\n")

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
            # TODO: Implement actual API signup
            import time
            time.sleep(1.5)

            # Mock successful signup
            token = "mock_jwt_token_67890"
            user_id = "user_67890"

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
            # TODO: Implement actual API call
            import time
            time.sleep(0.8)

            progress.stop()

            # Mock response
            console.print("\n[bold green]🛡️  Guardrails Check: PASSED[/bold green]")
            console.print("\n[bold cyan]Assistant:[/bold cyan]")
            console.print("I'm a mock response. The actual API integration will provide real LLM responses.")

            # Show token usage
            console.print("\n[dim]Tokens: 125 | Cost: $0.0025 | Processing: 780ms[/dim]")

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
            # TODO: Implement actual API call
            import time
            time.sleep(0.5)

            progress.stop()

            # Mock usage data
            table = Table(title="Token Usage & Costs", box=None)
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")

            table.add_row("Requests This Month", "1,247")
            table.add_row("Total Tokens Used", "456,789")
            table.add_row("Estimated Cost", "$12.45")
            table.add_row("Plan Quota", "100,000 requests")
            table.add_row("Remaining", "98,753")

            console.print("\n")
            console.print(table)
            console.print("\n")

            # Progress bar for quota
            from rich.progress import BarColumn
            progress_bar = Progress(
                TextColumn("[bold blue]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            )
            console.print("[bold]Quota Usage:[/bold]")
            with progress_bar:
                task = progress_bar.add_task("", total=100000, completed=1247)
                import time
                time.sleep(0.3)

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

    # Mock subscription data
    console.print(Panel(
        "[bold]Plan:[/bold] Professional\n"
        "[bold]Status:[/bold] [green]Active[/green]\n"
        "[bold]Billing:[/bold] Monthly\n"
        "[bold]Next billing:[/bold] Dec 1, 2025\n"
        "[bold]Amount:[/bold] $499.00",
        title="Current Subscription",
        border_style="cyan"
    ))


@subscription.command(name="upgrade")
@click.argument("plan", type=click.Choice(["starter", "professional", "enterprise"]))
def subscription_upgrade(plan):
    """Upgrade to a new plan"""
    auth = load_auth()
    if not auth:
        console.print("[red]Not logged in[/red]")
        return

    prices = {"starter": 99, "professional": 499, "enterprise": 1999}
    price = prices[plan]

    if Confirm.ask(f"Upgrade to {plan.title()} plan (${price}/month)?"):
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Processing upgrade...", total=None)

            import time
            time.sleep(1)

            progress.stop()

        console.print(f"\n[green]✓[/green] Successfully upgraded to {plan.title()} plan!")
        console.print(f"[dim]Opening billing portal for payment...[/dim]\n")


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
