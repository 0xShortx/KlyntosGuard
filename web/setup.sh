#!/bin/bash
# Quick setup script for KlyntosGuard Web App

set -e

echo "🛡️  KlyntosGuard Web App Setup"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the web directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Run this script from the web/ directory${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Step 2: Setting up environment...${NC}"
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✓${NC} Created .env.local from example"
        echo -e "${YELLOW}⚠ Please edit .env.local with your values${NC}"
        echo ""
    else
        echo -e "${RED}Error: .env.local.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} .env.local already exists"
    echo ""
fi

echo -e "${BLUE}Step 3: Database migration${NC}"
echo "Run this command to create the tables:"
echo ""
echo -e "${YELLOW}psql \$DATABASE_URL -f migrations/001_create_guard_api_keys.sql${NC}"
echo ""
echo "Or manually run the SQL from: migrations/001_create_guard_api_keys.sql"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit .env.local with your database URL and secrets"
echo "2. Run the database migration (see command above)"
echo "3. Start the dev server: ${YELLOW}npm run dev${NC}"
echo "4. Open: ${YELLOW}http://localhost:3001${NC}"
echo ""
echo "📚 See WEB_APP_COMPLETE.md for full documentation"
