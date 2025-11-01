# KlyntosGuard - Quick Start Guide

Get up and running with KlyntosGuard in 5 minutes!

## Installation

### Option 1: pip Install (Recommended)

```bash
pip install klyntos-guard
```

### Option 2: From Source

```bash
git clone https://github.com/0xShortx/KlyntosGuard.git
cd KlyntosGuard
pip install -e .
```

### Option 3: Docker

```bash
docker pull klyntos/guard:latest
docker run -p 8000:8000 -e OPENAI_API_KEY=your-key klyntos/guard
```

## Quick Setup

### 1. Initialize Configuration

```bash
# Initialize config files
klyntos-guard init

# Or use short alias
kg init
```

This creates:
- `.env` file with environment variables
- `config/guardrails.yaml` with default configuration

### 2. Set API Keys

Edit `.env`:

```bash
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### 3. Test It!

```bash
# Test from CLI
kg process --input "What's the weather like?"

# Start API server
kg serve
```

## Usage Examples

### CLI Usage

```bash
# Process text
kg process --input "Tell me about KlyntosGuard"

# With custom config
kg process --config my-config.yaml --input "Hello world"

# Run test suite
kg test
```

### Python SDK Usage

```python
from klyntos_guard.sdk import KlyntosGuardClient

# Initialize client
client = KlyntosGuardClient(api_key="your-api-key")

# Process input
result = await client.process("What's the weather like?")

if result["allowed"]:
    print("✓ Safe:", result["processed_output"])
else:
    print("✗ Blocked:", result["violations"])
```

### Direct Integration

```python
from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig
from klyntos_guard.adapters import OpenAIAdapter

# Initialize
config = GuardrailsConfig(config_path="config/guardrails.yaml")
adapter = OpenAIAdapter(api_key="sk-...", model="gpt-4")
engine = GuardrailsEngine(config=config, adapters=[adapter])

# Process
result = await engine.process("User input here")
```

### FastAPI Integration

```python
from fastapi import FastAPI, Depends
from klyntos_guard import GuardrailsEngine

app = FastAPI()

async def get_engine():
    # Initialize your engine
    return engine

@app.post("/chat")
async def chat(
    message: str,
    engine: GuardrailsEngine = Depends(get_engine)
):
    result = await engine.process(message)

    if not result.allowed:
        return {"error": "Input blocked", "reason": result.violations}

    return {"response": result.processed_output}
```

## API Server

### Start Server

```bash
# Development
kg serve --reload

# Production
kg serve --host 0.0.0.0 --port 8000
```

### API Endpoints

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Process guardrails
curl -X POST http://localhost:8000/api/v1/guardrails/process \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is the weather?",
    "context": {"user_id": "user123"}
  }'

# Get subscription
curl http://localhost:8000/api/v1/subscriptions/current \
  -H "Authorization: Bearer your-api-key"
```

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Individual Container

```bash
# Build
docker build -t klyntos-guard .

# Run
docker run -d \
  -p 8000:8000 \
  -e OPENAI_API_KEY=sk-... \
  -e DATABASE_URL=postgresql://... \
  --name klyntos-guard \
  klyntos-guard
```

## Configuration

### Basic Configuration (`config/guardrails.yaml`)

```yaml
llm:
  provider: openai
  model: gpt-4
  api_key: ${OPENAI_API_KEY}

input_rails:
  - name: content_safety
    enabled: true
    config:
      threshold: 0.8
      block_topics:
        - violence
        - hate_speech

  - name: pii_detection
    enabled: true
    config:
      action: redact  # or 'block', 'warn'

output_rails:
  - name: toxicity_filter
    enabled: true
    config:
      threshold: 0.8
      action: block
```

## Integration with Cursor/VS Code

### As Extension

```json
// settings.json
{
  "klyntosGuard.apiKey": "your-api-key",
  "klyntosGuard.endpoint": "http://localhost:8000",
  "klyntosGuard.enableAutoCheck": true
}
```

### As Development Tool

```python
# In your Python code
from klyntos_guard import GuardrailsEngine

# Wrap your AI calls
async def safe_llm_call(prompt: str):
    result = await engine.process(prompt)

    if not result.allowed:
        raise ValueError(f"Unsafe input: {result.violations}")

    # Continue with your LLM call
    response = await openai.chat.completions.create(...)
    return response
```

## Common Use Cases

### 1. Content Moderation

```yaml
input_rails:
  - name: content_safety
    enabled: true
    config:
      threshold: 0.7
      block_topics:
        - violence
        - hate_speech
        - illegal_activities
```

### 2. PII Protection

```yaml
input_rails:
  - name: pii_detection
    enabled: true
    config:
      detect:
        - email
        - phone_number
        - ssn
        - credit_card
      action: redact
```

### 3. Topic Control

```yaml
dialog_rails:
  - name: topic_control
    enabled: true
    config:
      allowed_topics:
        - customer_support
        - product_info
      blocked_topics:
        - politics
        - religion
```

### 4. Output Filtering

```yaml
output_rails:
  - name: toxicity_filter
    enabled: true
    config:
      threshold: 0.8

  - name: fact_checking
    enabled: true
    config:
      require_sources: true
```

## Troubleshooting

### Import Error

```bash
# Make sure package is installed
pip install -e .

# Or
pip install klyntos-guard
```

### API Connection Error

```bash
# Check if server is running
curl http://localhost:8000/api/v1/health

# Check environment variables
echo $OPENAI_API_KEY
```

### Database Error

```bash
# Run migrations
alembic upgrade head

# Or use SQLite for development
DATABASE_URL=sqlite:///./klyntos_guard.db
```

## Next Steps

1. **Read Full Documentation**: [docs.klyntos.com/guard](https://docs.klyntos.com/guard)
2. **Check Examples**: See `examples/` directory
3. **Join Community**: [Discord](https://discord.gg/klyntos)
4. **Deploy to Production**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Support

- **Documentation**: https://docs.klyntos.com/guard
- **GitHub Issues**: https://github.com/0xShortx/KlyntosGuard/issues
- **Discord**: https://discord.gg/klyntos
- **Email**: guard@klyntos.com

---

**Happy Building with KlyntosGuard!** 🛡️
