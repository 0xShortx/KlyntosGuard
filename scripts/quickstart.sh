#!/bin/bash
# Quick start script for KlyntosGuard local development

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  KlyntosGuard Quick Start${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓${NC} .env created. Please update with your values."
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}🐍 Creating Python virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo -e "${BLUE}🔄 Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -e .
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and run this script again."
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q "klyntos-postgres\|postgres"; then
    echo -e "${YELLOW}🐘 Starting PostgreSQL with Docker...${NC}"

    docker run -d \
        --name klyntos-postgres \
        -e POSTGRES_USER=klyntos \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=klyntos_guard \
        -p 5432:5432 \
        postgres:15-alpine

    echo -e "${GREEN}✓${NC} PostgreSQL started"
    echo -e "${BLUE}⏳ Waiting 5 seconds for PostgreSQL to initialize...${NC}"
    sleep 5
else
    echo -e "${GREEN}✓${NC} PostgreSQL already running"
fi

# Initialize database
echo -e "${YELLOW}🗄️  Initializing database...${NC}"
python scripts/init_db.py init --yes
echo ""

# Check if Redis container is running (optional)
if ! docker ps | grep -q "klyntos-redis\|redis"; then
    echo -e "${YELLOW}📦 Starting Redis with Docker (optional)...${NC}"

    docker run -d \
        --name klyntos-redis \
        -p 6379:6379 \
        redis:7-alpine

    echo -e "${GREEN}✓${NC} Redis started"
else
    echo -e "${GREEN}✓${NC} Redis already running"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Update .env file with your API keys (optional for basic testing)"
echo "   nano .env"
echo ""
echo "2. Start the API server:"
echo -e "   ${YELLOW}uvicorn klyntos_guard.api.main:app --reload${NC}"
echo ""
echo "3. In another terminal, test the CLI:"
echo -e "   ${YELLOW}source venv/bin/activate${NC}"
echo -e "   ${YELLOW}kg auth signup${NC}"
echo ""
echo "4. View API docs:"
echo "   http://localhost:8000/docs"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  kg --help              Show all CLI commands"
echo "  kg auth login          Login to your account"
echo "  kg chat                Start interactive chat"
echo "  kg usage               Check usage and quota"
echo ""
echo -e "${BLUE}To stop services:${NC}"
echo "  docker stop klyntos-postgres klyntos-redis"
echo ""
echo -e "${BLUE}To remove services:${NC}"
echo "  docker rm klyntos-postgres klyntos-redis"
echo ""
