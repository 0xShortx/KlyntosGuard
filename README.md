# KlyntosGuard

**Open-Source Platform for Programmable AI Safety Guardrails and Compliance**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## Overview

KlyntosGuard is a comprehensive, open-source platform for implementing programmable safety guardrails and compliance controls in AI-powered conversational and workflow applications. Built for enterprises, developers, and SaaS integrators, it provides a modular, extensible framework supporting all major LLMs.

### Key Features

- **Programmable Guardrails Engine** - Rule-based, scriptable safety and compliance controls
- **Multi-LLM Integration** - Adapters for OpenAI, Anthropic, Google, Azure, and more
- **Admin Dashboard** - React/Next.js interface for configuration, analytics, and audit trails
- **Extensible Plugin System** - Add custom rails, channels, and business logic
- **Comprehensive APIs** - RESTful and WebSocket endpoints for seamless integration
- **Flexible Deployment** - Cloud, on-premises, and containerized options
- **Enterprise-Ready** - Multi-tenancy, RBAC, audit logging, and compliance reporting

## Architecture

KlyntosGuard is built on a modular architecture with the following core components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│            (Web UI, APIs, CLI, SDKs)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Guardrails Engine                          │
│  • Input Rails    • Dialog Rails   • Output Rails          │
│  • Retrieval Rails • Execution Rails                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  LLM Integration Layer                      │
│  • OpenAI • Anthropic • Google • Azure • Custom            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         Storage & Monitoring                                │
│  • PostgreSQL • Redis • Logging • Metrics                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 18+ (for dashboard)
- PostgreSQL 12+ (optional, for production)
- Redis 6+ (optional, for caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/klyntosai/KlyntosGuard.git
cd KlyntosGuard

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies (optional)
pip install -r requirements-dev.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Start the server
python manage.py runserver
```

### Dashboard Setup

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

## Configuration

### Basic Guardrails Configuration

Create a configuration file `config/guardrails.yaml`:

```yaml
# LLM Configuration
llm:
  provider: openai
  model: gpt-4
  api_key: ${OPENAI_API_KEY}
  temperature: 0.7

# Input Rails
input_rails:
  - name: content_safety
    enabled: true
    config:
      block_topics:
        - violence
        - illegal_activities
        - hate_speech

  - name: pii_detection
    enabled: true
    config:
      detect:
        - email
        - phone_number
        - ssn
        - credit_card

# Output Rails
output_rails:
  - name: fact_checking
    enabled: true

  - name: toxicity_filter
    enabled: true
    threshold: 0.8

# Dialog Rails
dialog_rails:
  - name: topic_guidance
    enabled: true
    allowed_topics:
      - customer_support
      - product_information
      - general_inquiry
```

### Multi-LLM Setup

```python
from klyntos_guard import GuardrailsEngine
from klyntos_guard.adapters import OpenAIAdapter, AnthropicAdapter

# Initialize with multiple LLM backends
engine = GuardrailsEngine(
    adapters=[
        OpenAIAdapter(api_key="your-openai-key"),
        AnthropicAdapter(api_key="your-anthropic-key"),
    ],
    config_path="config/guardrails.yaml"
)

# Process input with guardrails
result = await engine.process(
    user_input="What's the weather like?",
    context={"user_id": "user123", "session_id": "sess456"}
)
```

## API Reference

### REST API

```bash
# Health check
GET /api/v1/health

# Process input with guardrails
POST /api/v1/guardrails/process
{
  "input": "user message",
  "context": {"user_id": "123"},
  "config_override": {}
}

# Get guardrail configuration
GET /api/v1/guardrails/config

# Update guardrail rules
PUT /api/v1/guardrails/rules/:id
{
  "enabled": true,
  "config": {}
}

# Audit logs
GET /api/v1/audit/logs?start_date=2025-01-01&end_date=2025-01-31
```

### WebSocket API

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/guardrails');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'process',
    payload: {
      input: 'user message',
      context: { user_id: '123' }
    }
  }));
};

ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Guardrails result:', result);
};
```

## Plugin Development

Create custom guardrail plugins:

```python
from klyntos_guard.plugins import BaseRail

class CustomComplianceRail(BaseRail):
    """Custom compliance checking rail."""

    def __init__(self, config):
        super().__init__(config)
        self.compliance_rules = config.get('rules', [])

    async def process_input(self, input_text, context):
        """Check input against compliance rules."""
        violations = []

        for rule in self.compliance_rules:
            if self.check_rule(input_text, rule):
                violations.append(rule)

        if violations:
            return {
                'blocked': True,
                'reason': 'compliance_violation',
                'violations': violations
            }

        return {'blocked': False}

    def check_rule(self, text, rule):
        # Implement your compliance logic
        pass

# Register the plugin
from klyntos_guard.registry import register_rail

register_rail('custom_compliance', CustomComplianceRail)
```

## Deployment

### Docker Deployment

```bash
# Build the image
docker build -t klyntos-guard:latest .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get pods -n klyntos-guard
```

### Subdomain Configuration (guard.klyntos.com)

See [deployment/README.md](deployment/README.md) for detailed instructions on configuring the subdomain deployment.

## Use Cases

### Enterprise Compliance
- GDPR, HIPAA, SOC2 compliance enforcement
- PII detection and redaction
- Regulated industry conversation controls

### Content Safety
- Toxicity and hate speech filtering
- Violence and illegal content blocking
- Brand safety for customer-facing AI

### Business Logic
- Topic steering and conversation flow
- Custom business rules enforcement
- Integration with CRM and ticketing systems

### RAG Applications
- Fact-checking and grounding
- Source verification
- Hallucination detection

## Roadmap

- [x] Core guardrails engine
- [x] Multi-LLM adapter system
- [x] REST and WebSocket APIs
- [ ] Admin dashboard (Q2 2025)
- [ ] Plugin marketplace (Q2 2025)
- [ ] Advanced analytics (Q3 2025)
- [ ] Managed cloud service (Q3 2025)
- [ ] Enterprise SLA offerings (Q4 2025)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Code formatting
black .
isort .

# Linting
flake8
mypy src/
```

## Community & Support

- **Documentation**: [https://docs.klyntos.com/guard](https://docs.klyntos.com/guard)
- **GitHub Issues**: [Report bugs or request features](https://github.com/klyntosai/KlyntosGuard/issues)
- **Discussions**: [Community forum](https://github.com/klyntosai/KlyntosGuard/discussions)
- **Discord**: [Join our community](https://discord.gg/klyntos)
- **Enterprise Support**: [sales@klyntos.com](mailto:sales@klyntos.com)

## License

KlyntosGuard is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

This project is inspired by and builds upon concepts from [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails). We're grateful to the open-source AI safety community for their pioneering work.

## Commercial Services

While KlyntosGuard is open-source and free to use, we offer commercial services:

- **Managed Hosting**: Fully managed cloud deployment at guard.klyntos.com
- **Enterprise Support**: SLA-backed support and dedicated success team
- **Custom Integration**: Professional services for complex deployments
- **Premium Plugins**: Advanced guardrails and compliance modules

Contact [sales@klyntos.com](mailto:sales@klyntos.com) for more information.

---

Built with ❤️ by the Klyntos team
