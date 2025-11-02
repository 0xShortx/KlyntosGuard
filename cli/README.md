# KlyntosGuard CLI

AI-powered code security scanner powered by Claude 3 Opus.

## Installation

### From PyPI (Coming Soon)

```bash
pip install klyntos-guard
```

### Development Installation

```bash
cd cli
pip install -e .
```

## Quick Start

### 1. Authenticate

```bash
# Login with browser
kg auth login

# Or use API key directly
kg auth login --api-key kg_your_api_key_here

# Check authentication status
kg auth whoami
```

### 2. Scan Your Code

```bash
# Scan a single file
kg scan myfile.py

# Scan entire project
kg scan . --recursive

# Get JSON output
kg scan . -r --format json

# Get SARIF output for GitHub
kg scan . -r --format sarif -o results.sarif
```

### 3. Configure Your Project

```bash
# Initialize config file
kg config init

# View current config
kg config show

# Set specific values
kg config set policy strict
kg config set severity.minimum high
```

### 4. View Scan History

```bash
# List recent scans
kg report list

# Show detailed report
kg report show abc123

# Export report
kg report export abc123 --format pdf -o report.pdf
```

## Configuration

Create a `.klyntosguard` file in your project root:

```yaml
version: "1.0"
policy: strict

scan:
  recursive: true
  max_file_size: 10485760  # 10MB

severity:
  minimum: medium
  fail_on: critical

exclude:
  - "node_modules/**"
  - "venv/**"
  - "*.test.js"

custom_rules:
  - name: "Internal API Key"
    pattern: "INTERNAL_API_.*"
    severity: critical
```

## Commands

### `kg scan [PATH]`

Scan code for security vulnerabilities.

**Options:**
- `-r, --recursive` - Scan directory recursively
- `-f, --format` - Output format (text, json, sarif)
- `-o, --output` - Output file path
- `--policy` - Security policy (strict, moderate, lax)
- `--fail-on` - Fail if severity level found (critical, high, medium, low)
- `--exclude` - Additional exclusion patterns
- `-v, --verbose` - Verbose output

**Examples:**
```bash
kg scan myfile.py
kg scan . -r --format json -o results.json
kg scan . --policy strict --fail-on high
```

### `kg auth`

Authentication management.

**Subcommands:**
- `login` - Login to KlyntosGuard
- `logout` - Logout and clear credentials
- `whoami` - Show current user info
- `status` - Check authentication status

**Examples:**
```bash
kg auth login
kg auth login --api-key kg_xxxxx
kg auth whoami
kg auth logout
```

### `kg config`

Configuration file management.

**Subcommands:**
- `init` - Create .klyntosguard config file
- `show` - Display current configuration
- `validate` - Validate config file
- `set KEY VALUE` - Update configuration value

**Examples:**
```bash
kg config init
kg config show
kg config set policy strict
kg config validate
```

### `kg report`

View and export scan reports.

**Subcommands:**
- `list` - List recent scan reports
- `show REPORT_ID` - Show detailed report
- `export REPORT_ID` - Export report to file

**Examples:**
```bash
kg report list --limit 20
kg report show abc123
kg report show abc123 --open
kg report export abc123 --format pdf -o report.pdf
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install KlyntosGuard
        run: pip install klyntos-guard

      - name: Run Security Scan
        env:
          KLYNTOS_GUARD_API_KEY: ${{ secrets.KLYNTOS_GUARD_API_KEY }}
        run: kg scan . --recursive --format sarif -o results.sarif --fail-on high

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

### GitLab CI

```yaml
security_scan:
  image: python:3.11
  script:
    - pip install klyntos-guard
    - kg scan . --recursive --format json -o results.json --fail-on high
  artifacts:
    reports:
      security: results.json
```

## Environment Variables

- `KLYNTOS_GUARD_API_KEY` - API key for authentication
- `KLYNTOS_GUARD_API` - Custom API endpoint (default: https://guard.klyntos.com/api/v1)

## Supported Languages

- Python (.py)
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Java (.java)
- Go (.go)
- PHP (.php)
- Ruby (.rb)
- C/C++ (.c, .cpp, .cc, .h, .hpp)
- C# (.cs)
- Rust (.rs)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- Shell (.sh, .bash, .zsh)

## Getting Your API Key

1. Sign up at https://guard.klyntos.com
2. Go to Settings → API Keys
3. Create a new API key
4. Copy and save it securely

## Support

- Documentation: https://documentation.klyntos.com
- Issues: https://github.com/0xShortx/KlyntosGuard/issues
- Email: support@klyntos.com

## License

MIT License - see LICENSE file for details
