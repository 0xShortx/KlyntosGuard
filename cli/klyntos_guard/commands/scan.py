"""
Scan Command - Code Security Analysis
"""

import click
import os
import json
import requests
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.syntax import Syntax
from rich import print as rprint

from ..utils.auth import get_api_key
from ..utils.file_scanner import scan_directory, get_file_language
from ..utils.config import load_config

console = Console()

API_URL = os.getenv("KLYNTOS_GUARD_API", "https://guard.klyntos.com/api/v1/scan")


@click.command()
@click.argument('path', type=click.Path(exists=True), default='.')
@click.option('--recursive', '-r', is_flag=True, help='Scan directory recursively')
@click.option('--format', '-f', type=click.Choice(['text', 'json', 'sarif']), default='text', help='Output format')
@click.option('--output', '-o', type=click.Path(), help='Output file')
@click.option('--policy', type=click.Choice(['strict', 'moderate', 'lax']), default='moderate', help='Security policy')
@click.option('--fail-on', type=click.Choice(['critical', 'high', 'medium', 'low']), help='Fail if vulnerability found')
@click.option('--exclude', multiple=True, help='Exclude patterns')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def scan(path, recursive, format, output, policy, fail_on, exclude, verbose):
    """
    🔍 Scan code for security vulnerabilities

    Examples:

      kg scan myfile.py
      kg scan . --recursive
      kg scan src/ -r --policy strict
      kg scan . -r --format json -o report.json
    """

    # Get API key
    api_key = get_api_key()
    if not api_key:
        console.print("[red]❌ Not authenticated. Run:[/red] kg auth login")
        raise click.Abort()

    # Load config
    config = load_config()
    if config:
        policy = config.get('policy', policy)
        if 'exclude' in config and not exclude:
            exclude = config['exclude']

    path_obj = Path(path)

    # Determine files to scan
    if path_obj.is_file():
        files_to_scan = [path_obj]
    elif path_obj.is_dir():
        if not recursive:
            console.print("[yellow]⚠️  Use --recursive to scan directories[/yellow]")
            raise click.Abort()
        files_to_scan = scan_directory(path_obj, exclude=exclude)
    else:
        console.print(f"[red]❌ Invalid path:[/red] {path}")
        raise click.Abort()

    if not files_to_scan:
        console.print("[yellow]⚠️  No files to scan[/yellow]")
        return

    console.print(f"\n[cyan]🔍 Scanning {len(files_to_scan)} file(s)...[/cyan]\n")

    # Scan all files
    all_results = []
    total_violations = 0
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Scanning files...", total=len(files_to_scan))

        for file_path in files_to_scan:
            progress.update(task, description=f"Scanning {file_path.name}...")

            try:
                result = scan_file(file_path, api_key, policy, verbose)
                all_results.append({
                    "file": str(file_path),
                    "result": result
                })

                if result and 'violations' in result:
                    total_violations += len(result['violations'])
                    for v in result['violations']:
                        severity = v['severity'].lower()
                        severity_counts[severity] = severity_counts.get(severity, 0) + 1

            except Exception as e:
                console.print(f"[red]❌ Error scanning {file_path}:[/red] {str(e)}")
                if verbose:
                    console.print_exception()

            progress.update(task, advance=1)

    # Display results
    if format == 'json':
        output_json(all_results, output)
    elif format == 'sarif':
        output_sarif(all_results, output)
    else:
        display_text_results(all_results, severity_counts, total_violations)

    # Check fail-on condition
    if fail_on:
        severity_levels = ['critical', 'high', 'medium', 'low']
        fail_index = severity_levels.index(fail_on)
        for i in range(fail_index + 1):
            if severity_counts.get(severity_levels[i], 0) > 0:
                console.print(f"\n[red]❌ FAILED:[/red] Found {severity_levels[i]} severity vulnerabilities")
                raise click.Abort()

    console.print("\n[green]✓ Scan complete[/green]")


def scan_file(file_path: Path, api_key: str, policy: str, verbose: bool):
    """Scan a single file"""

    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
    except UnicodeDecodeError:
        if verbose:
            console.print(f"[yellow]⚠️  Skipping binary file: {file_path}[/yellow]")
        return None

    # Detect language
    language = get_file_language(file_path)

    # Prepare request
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "code": code,
        "language": language,
        "filename": file_path.name,
        "policies": [policy]
    }

    # Make API request
    try:
        response = requests.post(API_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            console.print("[red]❌ Authentication failed. Invalid API key.[/red]")
            raise click.Abort()
        elif e.response.status_code == 429:
            console.print("[red]❌ Rate limit exceeded. Upgrade to Pro for unlimited scans.[/red]")
            raise click.Abort()
        else:
            raise


def display_text_results(results, severity_counts, total_violations):
    """Display results in text format"""

    console.print("\n" + "="*80 + "\n")
    console.print("[bold cyan]📊 Scan Results[/bold cyan]\n")

    for result_data in results:
        file_path = result_data['file']
        result = result_data['result']

        if not result or 'violations' not in result:
            continue

        violations = result['violations']
        if not violations:
            continue

        console.print(f"\n[bold]{file_path}[/bold]")
        console.print("─" * 80)

        for v in violations:
            # Severity color
            severity_colors = {
                'critical': 'red',
                'high': 'orange1',
                'medium': 'yellow',
                'low': 'blue',
                'info': 'cyan'
            }
            color = severity_colors.get(v['severity'].lower(), 'white')

            # Display violation
            console.print(f"\n[{color}]● {v['severity'].upper()}[/{color}] (Line {v['line']})")
            console.print(f"  [bold]{v['message']}[/bold]")
            console.print(f"  Category: {v['category']}")

            if v.get('suggestion'):
                console.print(f"  💡 [green]Fix:[/green] {v['suggestion']}")

            if v.get('code_snippet'):
                console.print(f"\n  Code:")
                syntax = Syntax(v['code_snippet'], "python", theme="monokai", line_numbers=True, start_line=v['line'])
                console.print(syntax, end="\n\n")

    # Summary
    console.print("\n" + "="*80)
    console.print("\n[bold]Summary:[/bold]")

    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Severity")
    table.add_column("Count", justify="right")

    for severity, count in severity_counts.items():
        if count > 0:
            severity_colors = {
                'critical': 'red',
                'high': 'orange1',
                'medium': 'yellow',
                'low': 'blue',
                'info': 'cyan'
            }
            color = severity_colors.get(severity, 'white')
            table.add_row(f"[{color}]{severity.upper()}[/{color}]", f"[{color}]{count}[/{color}]")

    console.print(table)
    console.print(f"\n[bold]Total Vulnerabilities:[/bold] {total_violations}")


def output_json(results, output_file):
    """Output results as JSON"""
    json_data = json.dumps(results, indent=2)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(json_data)
        console.print(f"[green]✓ Results saved to:[/green] {output_file}")
    else:
        console.print(json_data)


def output_sarif(results, output_file):
    """Output results in SARIF format"""
    # SARIF format for GitHub Code Scanning
    sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "KlyntosGuard",
                    "version": "1.0.0",
                    "informationUri": "https://guard.klyntos.com"
                }
            },
            "results": []
        }]
    }

    for result_data in results:
        file_path = result_data['file']
        result = result_data['result']

        if not result or 'violations' not in result:
            continue

        for v in result['violations']:
            sarif_result = {
                "ruleId": v['category'],
                "level": "error" if v['severity'] in ['critical', 'high'] else "warning",
                "message": {
                    "text": v['message']
                },
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {
                            "uri": file_path
                        },
                        "region": {
                            "startLine": v['line']
                        }
                    }
                }]
            }
            sarif["runs"][0]["results"].append(sarif_result)

    sarif_json = json.dumps(sarif, indent=2)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(sarif_json)
        console.print(f"[green]✓ SARIF results saved to:[/green] {output_file}")
    else:
        console.print(sarif_json)
