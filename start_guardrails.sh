#!/bin/bash

# KlyntosGuard Guardrails Server Startup Script

set -e

echo "🛡️  Starting KlyntosGuard Guardrails Server"
echo "==========================================="
echo ""

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  Warning: .env file not found"
    echo "   Using default configuration"
fi

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set in .env"
    echo "   Please edit .env and add your Anthropic API key"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source cli/venv/bin/activate

# Check if NeMo is installed
if ! python -c "import nemoguardrails" 2>/dev/null; then
    echo "❌ NeMo Guardrails not installed"
    echo "   Run: ./setup_guardrails.sh"
    exit 1
fi

echo "✅ NeMo Guardrails ready"
echo ""

# Display configuration
echo "Configuration:"
echo "  - Model: Claude 3.5 Sonnet (Anthropic)"
echo "  - Scanner API: ${KLYNTOS_GUARD_API:-http://localhost:3001/api/v1/scan}"
echo "  - Config Path: ./config"
echo "  - Actions: ./actions/code_security.py"
echo ""

# Start the server
echo "🚀 Starting NeMo Guardrails server..."
echo "   Server: http://localhost:8000"
echo "   Chat UI: http://localhost:8000/"
echo "   API: http://localhost:8000/v1/chat/completions"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Add actions directory to PYTHONPATH so NeMo can find our custom actions
export PYTHONPATH="${PWD}/actions:${PYTHONPATH}"

# Start server
nemoguardrails server --config=./config --port=8000
