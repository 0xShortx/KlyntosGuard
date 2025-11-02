#!/bin/bash

# Test script for KlyntosGuard Chat functionality
# This tests both the backend API and the CLI command

set -e

echo "🧪 Testing KlyntosGuard Chat Feature"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if CLI is installed
echo "1️⃣  Checking CLI installation..."
if ! command -v kg &> /dev/null; then
    echo -e "${YELLOW}⚠️  CLI not found. Installing in development mode...${NC}"
    cd "$(dirname "$0")"
    pip install -e . > /dev/null 2>&1
    echo -e "${GREEN}✓ CLI installed${NC}"
else
    echo -e "${GREEN}✓ CLI found${NC}"
fi
echo ""

# Check authentication
echo "2️⃣  Checking authentication..."
if ! kg auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated${NC}"
    echo "Please run: kg auth login"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Test 1: Help command
echo "3️⃣  Testing chat help..."
if kg chat --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Help command works${NC}"
else
    echo -e "${RED}❌ Help command failed${NC}"
    exit 1
fi
echo ""

# Test 2: Simple question (non-interactive)
echo "4️⃣  Testing simple question..."
RESPONSE=$(kg chat "What is SQL injection? Give a brief 2-sentence answer." 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Simple question works${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | head -n 5
else
    echo -e "${RED}❌ Simple question failed${NC}"
    echo "$RESPONSE"
    exit 1
fi
echo ""

# Test 3: Question with context
echo "5️⃣  Testing question with context..."
RESPONSE=$(kg chat "Explain this vulnerability" --context "CWE-89: SQL Injection" 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Question with context works${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | head -n 5
else
    echo -e "${RED}❌ Question with context failed${NC}"
    echo "$RESPONSE"
    exit 1
fi
echo ""

# Test 4: Question with file
echo "6️⃣  Testing question with file context..."
# Create a sample vulnerable file
cat > /tmp/test_vulnerable.py << 'EOF'
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Vulnerable to SQL injection
    query = "SELECT * FROM users WHERE id = " + user_id
    cursor.execute(query)
    return cursor.fetchone()
EOF

RESPONSE=$(kg chat "What security issues do you see in this code?" --file /tmp/test_vulnerable.py 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Question with file works${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | head -n 5
else
    echo -e "${RED}❌ Question with file failed${NC}"
    echo "$RESPONSE"
    exit 1
fi

# Cleanup
rm -f /tmp/test_vulnerable.py
echo ""

# Test 5: Backend API directly
echo "7️⃣  Testing backend API directly..."
API_KEY=$(cat ~/.klyntos-guard/credentials.json 2>/dev/null | grep -o '"api_key": "[^"]*"' | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Could not find API key, skipping API test${NC}"
else
    API_URL="${KLYNTOS_GUARD_API:-http://localhost:3001}/api/v1/chat"

    RESPONSE=$(curl -s -X POST "$API_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "messages": [
                {"role": "user", "content": "What is XSS? Answer in one sentence."}
            ],
            "max_tokens": 1000
        }')

    if echo "$RESPONSE" | grep -q '"response"'; then
        echo -e "${GREEN}✓ Backend API works${NC}"
        echo "API Response preview:"
        echo "$RESPONSE" | python3 -m json.tool | head -n 10
    else
        echo -e "${RED}❌ Backend API failed${NC}"
        echo "$RESPONSE"
        exit 1
    fi
fi
echo ""

# Summary
echo "===================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "📚 Usage Examples:"
echo ""
echo "  # Ask a question"
echo "  kg chat \"How do I prevent CSRF attacks?\""
echo ""
echo "  # Review code"
echo "  kg chat \"Review this code\" --file auth.py"
echo ""
echo "  # Interactive mode"
echo "  kg chat --interactive"
echo ""
echo "  # With context"
echo "  kg chat \"Explain this\" --context \"CWE-79: XSS\""
echo ""
