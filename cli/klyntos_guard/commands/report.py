"""
Report Command - View scan reports
"""

import click
import requests
import webbrowser
from rich.console import Console
from rich.table import Table
from rich import print as rprint

from ..utils.auth import get_api_key

console = Console()

API_URL = "https://guard.klyntos.com/api/v1"
DASHBOARD_URL = "https://guard.klyntos.com"


@click.group()
def report():
    """
    📊 View scan reports

    List and view security scan reports.
    """
    pass


@report.command('list')
@click.option('--limit', default=10, help='Number of reports to show')
def list_reports(limit):
    """
    List recent scan reports

    Shows your recent security scans.

    Example:
      kg report list
      kg report list --limit 20
    """

    api_key = get_api_key()
    if not api_key:
        console.print("[red]❌ Not authenticated. Run:[/red] kg auth login")
        raise click.Abort()

    console.print("\n[cyan]Fetching recent scans...[/cyan]\n")

    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.get(
            f"{API_URL}/scans",
            headers=headers,
            params={"limit": limit},
            timeout=10
        )
        response.raise_for_status()

        scans = response.json()

        if not scans or len(scans) == 0:
            console.print("[yellow]No scans found[/yellow]")
            console.print("\nRun your first scan: [cyan]kg scan myfile.py[/cyan]")
            return

        # Create table
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("ID")
        table.add_column("File")
        table.add_column("Vulnerabilities")
        table.add_column("Status")
        table.add_column("Date")

        for scan in scans:
            status_color = "green" if scan['status'] == 'passed' else "red"
            vuln_count = scan.get('vulnerability_count', 0)
            vuln_color = "red" if vuln_count > 0 else "green"

            table.add_row(
                scan['id'][:8],
                scan.get('filename', 'N/A'),
                f"[{vuln_color}]{vuln_count}[/{vuln_color}]",
                f"[{status_color}]{scan['status']}[/{status_color}]",
                scan.get('created_at', 'N/A')
            )

        console.print(table)
        console.print(f"\nShowing {len(scans)} of your recent scans")

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            console.print("[red]❌ Authentication failed[/red]")
            console.print("Run: kg auth login")
        else:
            console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()


@report.command('show')
@click.argument('report_id')
@click.option('--open', 'open_browser', is_flag=True, help='Open in browser')
def show_report(report_id, open_browser):
    """
    Show detailed scan report

    Displays detailed information about a specific scan.

    Example:
      kg report show abc123
      kg report show abc123 --open
    """

    if open_browser:
        # Open in browser
        url = f"{DASHBOARD_URL}/reports/{report_id}"
        console.print(f"\n[cyan]Opening report in browser...[/cyan]\n")
        console.print(f"URL: {url}")

        try:
            webbrowser.open(url)
        except Exception:
            console.print("[yellow]⚠️  Could not open browser automatically[/yellow]")

        return

    # Fetch and display report
    api_key = get_api_key()
    if not api_key:
        console.print("[red]❌ Not authenticated. Run:[/red] kg auth login")
        raise click.Abort()

    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.get(
            f"{API_URL}/scans/{report_id}",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()

        report_data = response.json()

        console.print(f"\n[bold cyan]Scan Report:[/bold cyan] {report_id}\n")
        console.print(f"File: {report_data.get('filename', 'N/A')}")
        console.print(f"Status: {report_data.get('status', 'N/A')}")
        console.print(f"Date: {report_data.get('created_at', 'N/A')}")
        console.print(f"\n[bold]Vulnerabilities:[/bold] {len(report_data.get('vulnerabilities', []))}\n")

        for vuln in report_data.get('vulnerabilities', []):
            severity_colors = {
                'critical': 'red',
                'high': 'orange1',
                'medium': 'yellow',
                'low': 'blue'
            }
            color = severity_colors.get(vuln['severity'].lower(), 'white')

            console.print(f"[{color}]● {vuln['severity'].upper()}[/{color}] (Line {vuln['line']})")
            console.print(f"  {vuln['message']}")
            console.print(f"  Category: {vuln['category']}\n")

        console.print(f"View full report: {DASHBOARD_URL}/reports/{report_id}")

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            console.print(f"[red]❌ Report not found:[/red] {report_id}")
        elif e.response.status_code == 401:
            console.print("[red]❌ Authentication failed[/red]")
        else:
            console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()


@report.command('export')
@click.argument('report_id')
@click.option('--format', type=click.Choice(['json', 'pdf', 'html']), default='json')
@click.option('--output', '-o', type=click.Path(), help='Output file')
def export_report(report_id, format, output):
    """
    Export scan report

    Downloads scan report in specified format.

    Example:
      kg report export abc123 --format json -o report.json
      kg report export abc123 --format pdf -o report.pdf
    """

    api_key = get_api_key()
    if not api_key:
        console.print("[red]❌ Not authenticated. Run:[/red] kg auth login")
        raise click.Abort()

    console.print(f"\n[cyan]Exporting report as {format}...[/cyan]\n")

    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.get(
            f"{API_URL}/scans/{report_id}/export",
            headers=headers,
            params={"format": format},
            timeout=30
        )
        response.raise_for_status()

        # Save to file
        if output:
            output_path = output
        else:
            output_path = f"report_{report_id}.{format}"

        with open(output_path, 'wb') as f:
            f.write(response.content)

        console.print(f"[green]✓ Report exported:[/green] {output_path}")

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            console.print(f"[red]❌ Report not found:[/red] {report_id}")
        else:
            console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()
    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")
        raise click.Abort()
