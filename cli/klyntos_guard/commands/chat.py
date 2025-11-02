"""
Chat Command - Interactive Security Assistant
"""

import click
import os
import json
import requests
from pathlib import Path
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich import print as rprint

from ..utils.auth import get_api_key

console = Console()

API_URL = os.getenv("KLYNTOS_GUARD_API", "https://guard.klyntos.com/api/v1/chat")


@click.command()
@click.argument('question', required=False)
@click.option('--interactive', '-i', is_flag=True, help='Start interactive chat mode')
@click.option('--file', '-f', type=click.Path(exists=True), help='Include file content in conversation')
@click.option('--context', '-c', help='Additional context for the question')
@click.option('--max-tokens', type=int, default=4096, help='Maximum response length')
def chat(question, interactive, file, context, max_tokens):
    """
    💬 Chat with AI security expert

    Examples:

      kg chat "How do I prevent SQL injection in Python?"
      kg chat --interactive
      kg chat "Review this code" --file auth.py
      kg chat "Explain this vulnerability" --context "CWE-89"
    """

    # Get API key
    api_key = get_api_key()
    if not api_key:
        console.print("[red]❌ Not authenticated. Run:[/red] kg auth login")
        raise click.Abort()

    # Interactive mode
    if interactive:
        start_interactive_chat(api_key, max_tokens)
        return

    # One-off question mode
    if not question:
        console.print("[yellow]⚠️  Provide a question or use --interactive flag[/yellow]")
        console.print("\nExamples:")
        console.print("  kg chat \"How do I prevent XSS attacks?\"")
        console.print("  kg chat --interactive")
        raise click.Abort()

    # Build message with optional file content
    user_message = build_message(question, file, context)

    # Send question
    with console.status("[cyan]🤔 Thinking...[/cyan]"):
        response = send_chat_message([{"role": "user", "content": user_message}], api_key, max_tokens)

    if response:
        display_response(response)


def start_interactive_chat(api_key: str, max_tokens: int):
    """Start interactive chat session"""

    console.print("\n[bold cyan]💬 KlyntosGuard Security Assistant[/bold cyan]")
    console.print("[dim]Type 'exit', 'quit', or press Ctrl+C to end the conversation[/dim]")
    console.print("[dim]Type 'clear' to start a new conversation[/dim]")
    console.print("[dim]Type 'help' for usage tips[/dim]\n")

    conversation_history = []

    while True:
        try:
            # Get user input
            user_input = Prompt.ask("\n[bold green]You[/bold green]")

            if not user_input.strip():
                continue

            # Handle commands
            if user_input.lower() in ['exit', 'quit']:
                console.print("\n[cyan]👋 Goodbye![/cyan]\n")
                break

            if user_input.lower() == 'clear':
                conversation_history = []
                console.print("\n[cyan]✓ Conversation cleared[/cyan]")
                continue

            if user_input.lower() == 'help':
                show_help()
                continue

            # Add user message to history
            conversation_history.append({
                "role": "user",
                "content": user_input
            })

            # Send message
            with console.status("[cyan]🤔 Thinking...[/cyan]"):
                response = send_chat_message(conversation_history, api_key, max_tokens)

            if response:
                assistant_message = response['response']

                # Add assistant response to history
                conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message
                })

                # Display response
                console.print("\n[bold cyan]Assistant[/bold cyan]")
                display_markdown(assistant_message)

                # Show token usage if available
                if 'usage' in response:
                    usage = response['usage']
                    console.print(
                        f"\n[dim]Tokens: {usage['input_tokens']} in / {usage['output_tokens']} out[/dim]"
                    )

        except KeyboardInterrupt:
            console.print("\n\n[cyan]👋 Goodbye![/cyan]\n")
            break
        except Exception as e:
            console.print(f"\n[red]❌ Error:[/red] {str(e)}")


def build_message(question: str, file_path: str = None, context: str = None) -> str:
    """Build message with optional file content and context"""

    message_parts = []

    if context:
        message_parts.append(f"Context: {context}\n")

    if file_path:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()

            file_name = Path(file_path).name
            message_parts.append(f"File: {file_name}\n```\n{file_content}\n```\n")
        except Exception as e:
            console.print(f"[yellow]⚠️  Could not read file:[/yellow] {str(e)}")

    message_parts.append(question)

    return "\n".join(message_parts)


def send_chat_message(messages: list, api_key: str, max_tokens: int) -> dict:
    """Send chat message to API"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "messages": messages,
        "max_tokens": max_tokens
    }

    try:
        response = requests.post(API_URL, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            console.print("[red]❌ Authentication failed. Invalid API key.[/red]")
            raise click.Abort()
        elif e.response.status_code == 429:
            console.print("[red]❌ Rate limit exceeded. Please try again later.[/red]")
            raise click.Abort()
        elif e.response.status_code == 400:
            error_msg = e.response.json().get('error', 'Invalid request')
            console.print(f"[red]❌ Error:[/red] {error_msg}")
            raise click.Abort()
        else:
            console.print(f"[red]❌ API Error:[/red] {e.response.status_code}")
            raise click.Abort()
    except requests.exceptions.Timeout:
        console.print("[red]❌ Request timed out. Please try again.[/red]")
        raise click.Abort()
    except requests.exceptions.RequestException as e:
        console.print(f"[red]❌ Connection error:[/red] {str(e)}")
        raise click.Abort()


def display_response(response: dict):
    """Display single response"""

    console.print("\n[bold cyan]💡 Answer[/bold cyan]\n")
    display_markdown(response['response'])

    if 'usage' in response:
        usage = response['usage']
        console.print(
            f"\n[dim]Tokens: {usage['input_tokens']} in / {usage['output_tokens']} out[/dim]\n"
        )


def display_markdown(text: str):
    """Display text as formatted markdown"""

    try:
        md = Markdown(text)
        console.print(md)
    except Exception:
        # Fallback to plain text if markdown rendering fails
        console.print(text)


def show_help():
    """Show help information"""

    help_text = """
[bold cyan]💬 Interactive Chat Commands[/bold cyan]

[bold]Basic Commands:[/bold]
  • Type your question and press Enter
  • [yellow]exit[/yellow] or [yellow]quit[/yellow] - End the conversation
  • [yellow]clear[/yellow] - Start a new conversation (clears history)
  • [yellow]help[/yellow] - Show this help message

[bold]Tips:[/bold]
  • Ask about specific vulnerabilities (e.g., "Explain SQL injection")
  • Request code reviews (copy/paste code in your message)
  • Ask for fix suggestions (e.g., "How do I fix this XSS issue?")
  • Reference CWE codes (e.g., "Tell me about CWE-89")

[bold]Examples:[/bold]
  • "How do I prevent CSRF attacks in Django?"
  • "Review this authentication function: [paste code]"
  • "What's the difference between authentication and authorization?"
  • "Explain CWE-79 and how to prevent it"

[bold]Multi-turn Conversation:[/bold]
  The assistant remembers previous messages in the conversation.
  Use "clear" to start fresh if you want to change topics.
"""

    console.print(Panel(help_text, title="Help", border_style="cyan"))
