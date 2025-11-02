#!/bin/bash

# KlyntosGuard Guardrails Setup Script
# This script sets up NeMo Guardrails from the cloned repository

set -e

echo "🛡️  KlyntosGuard Guardrails Setup"
echo "=================================="
echo ""

# Check if venv exists
if [ ! -d "cli/venv" ]; then
    echo "❌ Virtual environment not found. Please create it first:"
    echo "   cd cli && python -m venv venv"
    exit 1
fi

# Activate venv
echo "📦 Activating virtual environment..."
source cli/venv/bin/activate

# Install NeMo Guardrails from cloned repo in development mode
echo "📥 Installing NeMo Guardrails from cloned repository..."
cd nemo-guardrails
pip install -e .
cd ..

echo "✅ NeMo Guardrails installed in development mode"
echo ""

# Copy our custom config to NeMo's examples (optional)
echo "📋 Custom configuration is in ./config/"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# KlyntosGuard Guardrails Environment Variables

# Anthropic API Key (required for Claude)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# KlyntosGuard Scanner API
KLYNTOS_GUARD_API=http://localhost:3001/api/v1/scan

# API Key for Guardrails to authenticate with scanner
KLYNTOS_GUARD_API_KEY=kg_c3eecae2212dbfbae263d0d6bcd844d3ac9b94d90db169865334a6486d52d1d5

# PostgreSQL Database (same as web/.env.local)
DATABASE_URL=your-database-url-here
EOF
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY and DATABASE_URL"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your ANTHROPIC_API_KEY"
echo "2. Add the guardrails API key to your database:"
echo ""
echo "   Hashed key: 66a9f0d9f4190aa86083eedd02879712473ff36ac4d14952a82c55574784ffd8"
echo "   Raw key:    kg_c3eecae2212dbfbae263d0d6bcd844d3ac9b94d90db169865334a6486d52d1d5"
echo ""
echo "3. Start the guardrails server:"
echo "   ./start_guardrails.sh"
echo ""
