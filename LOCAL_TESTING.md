# Local Testing Guide

This guide helps you test the KlyntosGuard API and CLI locally with real authentication.

## Prerequisites

- Python 3.11+
- PostgreSQL database running
- Redis running (optional, for caching)

## Quick Start with Docker

The fastest way to test locally is using Docker Compose:

```bash
# Start all services (API, PostgreSQL, Redis)
docker-compose up -d

# Check logs
docker-compose logs -f api

# API will be available at http://localhost:8000
```

## Manual Setup

If you prefer running services individually:

### 1. Start PostgreSQL

```bash
# Using Docker
docker run -d \
  --name klyntos-postgres \
  -e POSTGRES_USER=klyntos \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=klyntos_guard \
  -p 5432:5432 \
  postgres:15-alpine

# Or use your existing PostgreSQL installation
```

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install package in development mode
pip install -e .
```

### 3. Set Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://klyntos:password@localhost:5432/klyntos_guard

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# JWT Secret (change in production)
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# LLM API Keys (optional, for guardrails processing)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# App Configuration
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000
```

### 4. Run Database Migrations

```bash
# Initialize database
alembic upgrade head
```

### 5. Start the API Server

```bash
# Development mode with auto-reload
uvicorn klyntos_guard.api.main:app --reload --host 0.0.0.0 --port 8000

# Or using the Python module directly
python -m klyntos_guard.api.main
```

The API will be available at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

## Testing the CLI

### 1. Install CLI Globally

```bash
# From project root
pip install -e .

# Verify installation
kg --version
```

### 2. Create an Account

```bash
# Sign up
kg auth signup
# Follow the prompts to enter email, name, and password

# Or login if you already have an account
kg auth login
```

### 3. Test Commands

```bash
# Check who you're logged in as
kg auth whoami

# View subscription plans
kg subscription plans

# Check usage
kg usage

# Process text through guardrails
kg chat "Hello, how are you?"

# Interactive chat mode
kg chat
```

## Testing Authentication Flow

### Manual API Testing with curl

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "SecurePassword123"
  }'

# 2. Login to get JWT token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
# Save the access_token from the response

# 3. Use the token to access protected endpoints
TOKEN="your-access-token-here"

curl -X GET http://localhost:8000/api/v1/subscriptions/current \
  -H "Authorization: Bearer $TOKEN"

# 4. Process text through guardrails
curl -X POST http://localhost:8000/api/v1/guardrails/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello, how are you?"
  }'
```

## Troubleshooting

### CLI can't connect to API

```bash
# Check if API is running
curl http://localhost:8000/api/v1/health

# Set custom API URL
export KLYNTOS_GUARD_API=http://localhost:8000/api/v1
kg auth login
```

### Database connection issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
cat .env | grep DATABASE_URL

# Test connection manually
psql postgresql://klyntos:password@localhost:5432/klyntos_guard
```

### Token expired or invalid

```bash
# Logout and login again
kg auth logout
kg auth login
```

### View CLI auth file

```bash
# Location: ~/.klyntos_guard/auth.json
cat ~/.klyntos_guard/auth.json
```

## Next Steps

After testing locally:

1. **Add LLM API Keys**: Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to enable actual LLM processing
2. **Configure Guardrails**: Edit `config/guardrails.yaml` to customize safety rules
3. **Set up Stripe**: Add `STRIPE_API_KEY` to enable payment processing
4. **Deploy to Production**: Follow deployment guide for guard.klyntos.com

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Guardrails
- `POST /api/v1/guardrails/process` - Process text through guardrails
- `GET /api/v1/guardrails/config` - Get guardrails configuration

### Subscriptions
- `GET /api/v1/subscriptions/plans` - List available plans
- `GET /api/v1/subscriptions/current` - Get current subscription
- `POST /api/v1/subscriptions/checkout` - Create checkout session

### Audit
- `GET /api/v1/audit/logs` - Get audit logs
- `GET /api/v1/audit/stats` - Get usage statistics

### Health
- `GET /api/v1/health` - Health check endpoint
