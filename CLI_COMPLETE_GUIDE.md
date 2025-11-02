# KlyntosGuard CLI - Complete Guide

AI-powered code security scanner with interactive chat assistant.

## Quick Start

```bash
# Install the CLI
cd KlyntosGuard/cli
pip install -e .

# Authenticate
kg auth login

# Scan code for vulnerabilities
kg scan myfile.py

# Chat with AI security expert
kg chat --interactive
```

---

## Installation

### From Source

```bash
git clone https://github.com/0xShortx/KlyntosGuard.git
cd KlyntosGuard/cli
pip install -e .
```

### Verify Installation

```bash
kg --version
kg --help
```

---

## Authentication

### Login

```bash
kg auth login
```

You'll be prompted to enter your API key. Get your API key from:
https://guard.klyntos.com/settings/api-keys

### Check Authentication Status

```bash
kg auth status
```

Shows your current authentication state and user information.

### Logout

```bash
kg auth logout
```

---

## Scanning Code

### Scan a Single File

```bash
kg scan myfile.py
```

### Scan an Entire Directory

```bash
kg scan . --recursive
```

### Scan with Specific Policy

```bash
kg scan src/ -r --policy strict
```

**Policy Options:**
- `strict` - Highest security standards, catches all potential issues
- `moderate` - Balanced approach (default)
- `lax` - Only critical and high severity issues

### Output Formats

#### Text Output (Default)

```bash
kg scan myfile.py
```

Provides a beautiful terminal display with:
- Color-coded severity levels
- Code snippets with line numbers
- Fix suggestions
- CWE references

#### JSON Output

```bash
kg scan . -r --format json -o report.json
```

Machine-readable format for CI/CD integration.

#### SARIF Output

```bash
kg scan . -r --format sarif -o report.sarif
```

GitHub Code Scanning compatible format.

### Advanced Scanning Options

#### Fail on Severity

```bash
# Fail if any critical vulnerabilities found
kg scan . -r --fail-on critical

# Fail on high or above
kg scan . -r --fail-on high
```

Perfect for CI/CD pipelines to block merges with security issues.

#### Exclude Patterns

```bash
kg scan . -r --exclude "node_modules/*" --exclude "*.test.js"
```

#### Verbose Output

```bash
kg scan . -r --verbose
```

Shows detailed scanning progress and debug information.

---

## Interactive Chat - AI Security Assistant

The CLI includes a powerful interactive chat feature powered by Claude AI. Get instant answers to security questions, code reviews, and vulnerability explanations.

### Start Interactive Mode

```bash
kg chat --interactive
```

This starts a conversation with the AI security expert. You can:
- Ask questions about vulnerabilities
- Get code reviews
- Learn security best practices
- Get fix suggestions
- Reference specific CWEs or CVEs

**Example Conversation:**

```
💬 KlyntosGuard Security Assistant
Type 'exit', 'quit', or press Ctrl+C to end the conversation
Type 'clear' to start a new conversation
Type 'help' for usage tips

You: What is SQL injection?