"""Main CLI application using Click."""

import click
import asyncio
from pathlib import Path

from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig
from klyntos_guard.adapters import OpenAIAdapter


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """KlyntosGuard - AI Safety Guardrails Platform"""
    pass


@cli.command()
@click.option("--config", "-c", type=click.Path(), help="Path to config file")
@click.option("--input", "-i", prompt="Input text", help="Text to process")
@click.option("--api-key", envvar="OPENAI_API_KEY", help="OpenAI API key")
def process(config, input, api_key):
    """Process input through guardrails."""
    click.echo(f"Processing: {input[:50]}...")

    # Load configuration
    if config:
        cfg = GuardrailsConfig(config_path=config)
    else:
        cfg = GuardrailsConfig(config_path="config/guardrails.yaml")

    # Initialize adapter
    adapter = OpenAIAdapter(api_key=api_key, model="gpt-4")

    # Create engine
    engine = GuardrailsEngine(config=cfg, adapters=[adapter])

    # Process asynchronously
    result = asyncio.run(engine.process(input))

    if result.allowed:
        click.secho("✓ ALLOWED", fg="green")
        if result.processed_output:
            click.echo(f"\nResponse: {result.processed_output}")
        if result.warnings:
            click.secho(f"\nWarnings: {', '.join(result.warnings)}", fg="yellow")
    else:
        click.secho("✗ BLOCKED", fg="red")
        click.echo(f"\nReason: {result.violations[0].message if result.violations else 'Unknown'}")

    click.echo(f"\nProcessing time: {result.processing_time_ms:.2f}ms")


@cli.command()
def init():
    """Initialize KlyntosGuard configuration."""
    click.echo("Initializing KlyntosGuard...")

    # Create config directory
    config_dir = Path("config")
    config_dir.mkdir(exist_ok=True)

    # Create .env file
    env_file = Path(".env")
    if not env_file.exists():
        env_file.write_text("""# KlyntosGuard Configuration
OPENAI_API_KEY=your-api-key-here
ANTHROPIC_API_KEY=your-api-key-here
DATABASE_URL=sqlite:///./klyntos_guard.db
""")
        click.secho("✓ Created .env file", fg="green")
    else:
        click.secho("! .env file already exists", fg="yellow")

    # Create sample config
    config_file = config_dir / "guardrails.yaml"
    if not config_file.exists():
        config_file.write_text("""# KlyntosGuard Configuration
llm:
  provider: openai
  model: gpt-4
  api_key: ${OPENAI_API_KEY}

input_rails:
  - name: content_safety
    enabled: true
    config:
      threshold: 0.8

  - name: pii_detection
    enabled: true
    config:
      action: redact

output_rails:
  - name: toxicity_filter
    enabled: true
    config:
      threshold: 0.8
""")
        click.secho(f"✓ Created {config_file}", fg="green")
    else:
        click.secho(f"! {config_file} already exists", fg="yellow")

    click.echo("\nKlyntosGuard initialized! Edit config/guardrails.yaml to customize.")


@cli.command()
@click.option("--host", default="0.0.0.0", help="Host to bind to")
@click.option("--port", default=8000, type=int, help="Port to bind to")
@click.option("--reload", is_flag=True, help="Enable auto-reload")
def serve(host, port, reload):
    """Start the KlyntosGuard API server."""
    import uvicorn

    click.echo(f"Starting KlyntosGuard API on {host}:{port}")

    uvicorn.run(
        "klyntos_guard.api.main:app",
        host=host,
        port=port,
        reload=reload,
    )


@cli.command()
def test():
    """Run a quick test of guardrails."""
    click.echo("Running guardrails test...")

    test_inputs = [
        ("Hello, how are you?", True),
        ("My email is test@example.com", False),  # PII
        ("This is toxic garbage!", False),  # Toxic
    ]

    for text, should_pass in test_inputs:
        click.echo(f"\nTesting: {text}")
        # TODO: Actually run through engine
        if should_pass:
            click.secho("  ✓ PASS", fg="green")
        else:
            click.secho("  ✗ BLOCK", fg="red")


if __name__ == "__main__":
    cli()
