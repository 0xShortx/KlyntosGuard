# KlyntosGuard CLI Guide

Beautiful, feature-rich CLI for AI safety guardrails - inspired by Cursor and Gemini.

## Installation

```bash
# From source
cd KlyntosGuard
pip install -e .

# Or from PyPI (when published)
pip install klyntos-guard
```

## Quick Start

```bash
# Sign up
kg auth signup

# Login
kg auth login

# Start chatting
kg chat

# View usage
kg usage

# Manage subscription
kg subscription plans
```

---

## Commands Reference

### 🔐 Authentication

#### Sign Up
```bash
kg auth signup
# Interactive prompts for:
# - Email
# - Full name
# - Password
```

#### Login
```bash
kg auth login
# Or with email
kg auth login --email user@example.com
```

#### Check Current User
```bash
kg auth whoami
# Shows:
# - Email
# - User ID
# - Login timestamp
```

#### Logout
```bash
kg auth logout
```

---

### 💬 Chat & Processing

#### Interactive Chat
```bash
# Start interactive chat mode
kg chat

# In chat mode, you can:
# - Type messages naturally
# - Use /commands
# - Stream responses in real-time
```

**Chat Commands:**
- `/help` - Show help
- `/usage` - Show token usage
- `/clear` - Clear screen
- `exit` or `quit` - Exit chat

#### Single Message
```bash
# Process a single message
kg chat "What's the weather like today?"

# With streaming
kg chat --stream "Tell me a story"
```

---

### 📊 Usage & Billing

#### View Usage
```bash
kg usage

# Shows:
# - Requests this month
# - Total tokens used
# - Estimated costs
# - Plan quota
# - Remaining requests
# - Visual progress bar
```

---

### 💳 Subscription Management

#### View Plans
```bash
kg subscription plans

# Displays beautiful table with:
# - Plan names (Free, Starter, Professional, Enterprise)
# - Pricing
# - Request limits
# - Features
```

#### Current Subscription
```bash
kg subscription current

# Shows:
# - Current plan
# - Status (Active/Canceled)
# - Billing cycle
# - Next billing date
# - Amount
```

#### Upgrade Plan
```bash
# Upgrade to a specific plan
kg subscription upgrade starter
kg subscription upgrade professional
kg subscription upgrade enterprise

# Opens billing portal for payment
```

---

### ⚙️  Configuration

#### Interactive Configuration
```bash
kg config

# Wizard prompts for:
# - LLM provider (OpenAI, Anthropic, Google)
# - Model selection
# - Safety level (Strict, Balanced, Lenient)
```

#### Initialize Configuration Files
```bash
kg init

# Creates:
# - .env file
# - config/guardrails.yaml
```

---

### 🚀 Server

#### Start API Server
```bash
# Development mode
kg serve --reload

# Production mode
kg serve --host 0.0.0.0 --port 8000

# Custom configuration
kg serve --config my-config.yaml
```

---

### 🧪 Testing

#### Run Tests
```bash
kg test

# Tests various inputs:
# - Normal messages
# - PII detection
# - Toxicity filtering
```

---

## CLI Features

### 🎨 Beautiful UI

The CLI uses **Rich** library for beautiful formatting:

- **Colors**: Cyan, green, red, yellow for different states
- **Spinners**: Loading indicators for API calls
- **Progress Bars**: Visual quota usage
- **Tables**: Clean data presentation
- **Panels**: Organized information boxes
- **Live Updates**: Streaming responses

### ⚡ Interactive Mode

Chat mode provides a conversation-like experience:

```
🛡️  KlyntosGuard Chat
───────────────────────────────────────

Type your message and press Enter.
Type 'exit' or 'quit' to leave.
Type '/help' for commands.

You: What's the weather?
🛡️  Guardrails Check: PASSED