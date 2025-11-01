# Getting Started with KlyntosGuard

This guide will help you set up and start using KlyntosGuard in your AI applications.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Basic Usage](#basic-usage)
5. [Advanced Features](#advanced-features)
6. [Integration Examples](#integration-examples)
7. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager
- (Optional) PostgreSQL 12+ for production
- (Optional) Redis 6+ for caching

### Step 1: Clone the Repository

```bash
git clone https://github.com/klyntosai/KlyntosGuard.git
cd KlyntosGuard
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
# Install core dependencies
pip install -r requirements.txt

# (Optional) Install development dependencies
pip install -r requirements-dev.txt
```

### Step 4: Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required environment variables:**

```bash
# LLM API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Application Configuration
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/klyntos_guard
```

## Quick Start

### Option 1: Using the Python API

```python
from klyntos_guard import GuardrailsEngine
from klyntos_guard.core.config import GuardrailsConfig
from klyntos_guard.adapters.openai import OpenAIAdapter

# Initialize configuration
config = GuardrailsConfig(config_path="config/guardrails.yaml")

# Add LLM adapter
adapter = OpenAIAdapter(
    api_key="your-openai-api-key",
    model="gpt-4"
)

# Create engine
engine = GuardrailsEngine(
    config=config,
    adapters=[adapter]
)

# Process input
result = await engine.process(
    user_input="What's the weather like?",
    context={
        "user_id": "user123",
        "session_id": "session456"
    }
)

# Check result
if result.allowed:
    print("Response:", result.processed_output)
else:
    print("Blocked:", result.violations)
```

### Option 2: Using the REST API

#### Start the Server

```bash
# Development server
uvicorn src.klyntos_guard.api.main:app --reload --port 8000

# Production server
uvicorn src.klyntos_guard.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Make API Requests

```bash
# Process input with guardrails
curl -X POST http://localhost:8000/api/v1/guardrails/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "input": "What is the capital of France?",
    "context": {
      "user_id": "user123"
    }
  }'
```

### Option 3: Using Docker

```bash
# Build the image
docker build -t klyntos-guard:latest .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Configuration

### Basic Configuration

Create a `config/guardrails.yaml` file:

```yaml
# Minimal configuration
llm:
  provider: openai
  model: gpt-4
  api_key: ${OPENAI_API_KEY}

input_rails:
  - name: content_safety
    enabled: true
    config:
      block_topics:
        - violence
        - hate_speech

output_rails:
  - name: toxicity_filter
    enabled: true
    config:
      threshold: 0.8
```

### Advanced Configuration

See [config/guardrails.example.yaml](config/guardrails.example.yaml) for a comprehensive configuration example with all available options.

## Basic Usage

### 1. Content Safety

Prevent toxic or harmful content:

```python
from klyntos_guard import GuardrailsEngine

engine = GuardrailsEngine(config_path="config/guardrails.yaml")

# This will be blocked
result = await engine.process("How to make a bomb?")
assert not result.allowed
print(result.violations)  # Shows content safety violation

# This will pass
result = await engine.process("How do I bake a cake?")
assert result.allowed
```

### 2. PII Detection and Redaction

Automatically detect and redact personal information:

```python
# Input with PII
result = await engine.process(
    "My email is john@example.com and phone is 555-1234"
)

# PII is redacted
print(result.processed_output)
# "My email is [EMAIL REDACTED] and phone is [PHONE REDACTED]"
```

### 3. Custom Context

Pass context for better guardrail decisions:

```python
from klyntos_guard.core.types import ProcessingContext

context = ProcessingContext(
    user_id="user123",
    session_id="session456",
    tenant_id="company-abc",
    metadata={
        "user_role": "customer",
        "subscription_tier": "pro",
        "conversation_topic": "technical_support"
    }
)

result = await engine.process("Help me with my account", context=context)
```

### 4. Multiple LLM Providers

Use different LLM providers with fallback:

```python
from klyntos_guard.adapters import OpenAIAdapter, AnthropicAdapter

engine = GuardrailsEngine(
    adapters=[
        OpenAIAdapter(api_key="...", model="gpt-4"),
        AnthropicAdapter(api_key="...", model="claude-3-opus-20240229")
    ],
    config_path="config/guardrails.yaml"
)

# Engine will use OpenAI by default, fall back to Anthropic if needed
```

## Advanced Features

### Custom Guardrails

Create your own guardrail:

```python
from klyntos_guard.rails import BaseRail, register_rail
from klyntos_guard.core.types import ProcessingContext

@register_rail("profanity_filter")
class ProfanityFilter(BaseRail):
    """Custom profanity filtering rail."""

    async def process_input(self, input_text: str, context: ProcessingContext):
        profanity_list = self.config.get("words", [])

        # Check for profanity
        for word in profanity_list:
            if word.lower() in input_text.lower():
                return {
                    "blocked": True,
                    "severity": "medium",
                    "message": f"Input contains profanity: {word}",
                    "details": {"detected_word": word}
                }

        return {"blocked": False}

# Use in configuration
# config/guardrails.yaml
# input_rails:
#   - name: profanity_filter
#     enabled: true
#     config:
#       words: ["badword1", "badword2"]
```

### Streaming Responses

Process streaming LLM responses with guardrails:

```python
async for chunk in engine.process_stream(
    user_input="Tell me a story",
    context=context
):
    print(chunk, end="", flush=True)
```

### Batch Processing

Process multiple inputs efficiently:

```python
inputs = [
    "What's the weather?",
    "How do I reset my password?",
    "Tell me about your pricing"
]

results = await engine.process_batch(inputs)

for input_text, result in zip(inputs, results):
    print(f"Input: {input_text}")
    print(f"Allowed: {result.allowed}")
    print(f"Output: {result.processed_output}\n")
```

## Integration Examples

### 1. FastAPI Integration

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from klyntos_guard import GuardrailsEngine

app = FastAPI()
engine = GuardrailsEngine(config_path="config/guardrails.yaml")

class ChatRequest(BaseModel):
    message: str
    user_id: str

@app.post("/chat")
async def chat(request: ChatRequest):
    result = await engine.process(
        request.message,
        context={"user_id": request.user_id}
    )

    if not result.allowed:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Input blocked by guardrails",
                "violations": [v.dict() for v in result.violations]
            }
        )

    return {
        "response": result.processed_output,
        "processing_time_ms": result.processing_time_ms
    }
```

### 2. LangChain Integration

```python
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from klyntos_guard import GuardrailsEngine

# Wrap LangChain with guardrails
class GuardedLLMChain:
    def __init__(self, chain: LLMChain, guardrails: GuardrailsEngine):
        self.chain = chain
        self.guardrails = guardrails

    async def run(self, input_text: str, **kwargs):
        # Apply input guardrails
        input_result = await self.guardrails.process(input_text)

        if not input_result.allowed:
            raise ValueError(f"Input blocked: {input_result.violations}")

        # Run LangChain
        output = await self.chain.arun(input_result.processed_output, **kwargs)

        # Apply output guardrails
        output_result = await self.guardrails.process(output)

        if not output_result.allowed:
            raise ValueError(f"Output blocked: {output_result.violations}")

        return output_result.processed_output

# Usage
llm = OpenAI(temperature=0.7)
prompt = PromptTemplate(...)
chain = LLMChain(llm=llm, prompt=prompt)

guarded_chain = GuardedLLMChain(
    chain=chain,
    guardrails=GuardrailsEngine(config_path="config/guardrails.yaml")
)

result = await guarded_chain.run("Your input here")
```

### 3. Streamlit Chat App

```python
import streamlit as st
from klyntos_guard import GuardrailsEngine

# Initialize engine
if 'engine' not in st.session_state:
    st.session_state.engine = GuardrailsEngine(
        config_path="config/guardrails.yaml"
    )

st.title("AI Chat with Guardrails")

# Chat input
user_input = st.text_input("You:", "")

if user_input:
    with st.spinner("Processing..."):
        result = await st.session_state.engine.process(user_input)

    if result.allowed:
        st.success("AI: " + result.processed_output)

        if result.warnings:
            st.warning("Warnings: " + ", ".join(result.warnings))
    else:
        st.error("Message blocked by safety guardrails")
        for violation in result.violations:
            st.write(f"- {violation.message}")
```

## Troubleshooting

### Common Issues

#### 1. Import Errors

```bash
# Error: ModuleNotFoundError: No module named 'klyntos_guard'

# Solution: Install in development mode
pip install -e .
```

#### 2. API Key Not Found

```bash
# Error: OpenAI API key not found

# Solution: Set environment variable
export OPENAI_API_KEY=sk-...

# Or add to .env file
echo "OPENAI_API_KEY=sk-..." >> .env
```

#### 3. Database Connection Error

```bash
# Error: could not connect to server

# Solution: Start PostgreSQL or use SQLite for development
# In .env:
DATABASE_URL=sqlite:///./klyntos_guard.db
```

#### 4. Rail Configuration Not Loading

```python
# Error: Rail 'content_safety' not found

# Solution: Ensure rails are properly registered
from klyntos_guard.rails import content_safety  # Import rail module
```

### Performance Optimization

#### Enable Caching

```yaml
# config/guardrails.yaml
settings:
  cache_enabled: true
  cache_ttl: 3600
```

#### Parallel Processing

```yaml
# config/guardrails.yaml
settings:
  parallel_rails: true  # Run independent rails in parallel
```

#### Use Lightweight Models

For faster processing, use lighter models for certain rails:

```yaml
llm:
  provider: openai
  model: gpt-3.5-turbo  # Faster than gpt-4
```

### Getting Help

- **Documentation**: [https://docs.klyntos.com/guard](https://docs.klyntos.com/guard)
- **GitHub Issues**: [https://github.com/klyntosai/KlyntosGuard/issues](https://github.com/klyntosai/KlyntosGuard/issues)
- **Discord Community**: [https://discord.gg/klyntos](https://discord.gg/klyntos)
- **Email Support**: [guard@klyntos.com](mailto:guard@klyntos.com)

## Next Steps

1. **Explore Examples**: Check out the [examples/](examples/) directory for more use cases
2. **Read the Docs**: Visit our [documentation site](https://docs.klyntos.com/guard)
3. **Join the Community**: Connect with other users on [Discord](https://discord.gg/klyntos)
4. **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
5. **Deploy to Production**: Read the [deployment guide](deployment/README.md)

---

**Happy building with KlyntosGuard!** 🛡️
