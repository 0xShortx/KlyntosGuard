# NeMo Guardrails Integration Plan

## Overview

We're integrating NVIDIA NeMo Guardrails into KlyntosGuard to create a hybrid security platform:
- **NeMo Guardrails**: Prevents AI from generating vulnerable code (proactive)
- **Our Scanner**: Catches vulnerabilities in existing code (reactive)

## What We Get from NeMo

✅ **Complete Guardrails System**
- Input/Output/Dialog/Retrieval/Execution rails
- Colang configuration language
- LLM integration (OpenAI, Anthropic, etc.)
- Chat UI (forked from chatbot-ui)
- Server API with `/v1/chat/completions` endpoint

✅ **Built-in Features**
- Jailbreak prevention
- Topic control
- Fact-checking
- Hallucination detection
- Custom actions/tools
- RAG support

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  KlyntosGuard Platform                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  NeMo Guardrails │    │  Code Scanner    │          │
│  │  (from NVIDIA)   │    │  (Our existing)  │          │
│  └────────┬─────────┘    └────────┬─────────┘          │
│           │                       │                     │
│           └───────┬───────────────┘                     │
│                   ▼                                     │
│       ┌───────────────────────┐                        │
│       │  Custom Action:       │                        │
│       │  validate_code()      │                        │
│       └───────────────────────┘                        │
│           Calls our scanner!                            │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │    Unified Dashboard (Next.js)           │          │
│  │  - Scan results                          │          │
│  │  - Guardrail events                      │          │
│  │  - Combined security view                │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Installation Steps

### 1. Install NeMo Guardrails

```bash
# Install NeMo Guardrails
pip install nemoguardrails

# Or install in our project
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard
pip install -e ./nemo-guardrails
```

### 2. Create KlyntosGuard Configuration

Create config for code security (not general chat safety):

```yaml
# config/klyntos-guard-config.yml

models:
  - type: main
    engine: anthropic
    model: claude-3-5-sonnet-20241022

rails:
  config:
    # Input rails for code generation requests
    input:
      flows:
        - check for insecure code requests
        - validate programming language
        - ensure security context

    # Output rails for generated code
    output:
      flows:
        - scan for vulnerabilities
        - check for secrets
        - validate secure patterns

    # Execution rails - validate code before returning
    execution:
      flows:
        - run security scanner
        - check for SQL injection patterns
        - check for XSS patterns
        - check for authentication bypasses

# Custom actions
actions:
  - name: validate_code
    description: "Scan code for security vulnerabilities using KlyntosGuard scanner"
    parameters:
      code: string
      language: string
    returns:
      safe: boolean
      issues: array

  - name: suggest_secure_alternative
    description: "Provide secure code alternative"
    parameters:
      vulnerable_code: string
    returns:
      secure_code: string
      explanation: string
```

### 3. Create Colang Flows for Code Security

```colang
# config/rails/code_security.co

# Input rail: Block requests for insecure code
define flow check for insecure code requests
  user request to generate insecure code
  bot inform cannot assist with insecure code
  bot offer secure alternative

# Example
define user request to generate insecure code
  "write code to bypass authentication"
  "create SQL injection"
  "how to disable security"

define bot inform cannot assist with insecure code
  "I cannot help you write insecure code. Would you like me to show you secure authentication instead?"

# Output rail: Scan generated code
define flow scan for vulnerabilities
  bot generate code
  execute validate_code(code=$bot_message, language=$context.language)
  if $validate_code.safe == false
    bot show security issues
    bot suggest fixes
  else
    bot return code
```

### 4. Implement Custom Action: validate_code

This action calls our existing scanner!

```python
# actions/code_security.py

from typing import Optional
from nemoguardrails.actions import action
import sys
sys.path.append('/path/to/KlyntosGuard/cli')

from klyntos_guard.commands.scan import scan_code

@action(is_system_action=True)
async def validate_code(code: str, language: str) -> dict:
    """
    Validate code using KlyntosGuard scanner.
    This is the bridge between NeMo Guardrails and our scanner!
    """

    # Use our existing scanner
    result = scan_code(code, language)

    return {
        "safe": not result.has_issues(),
        "issues": [
            {
                "type": v["category"],
                "severity": v["severity"],
                "line": v["line"],
                "message": v["message"],
                "suggestion": v.get("suggestion")
            }
            for v in result.violations
        ]
    }

@action()
async def suggest_secure_alternative(vulnerable_code: str, language: str) -> dict:
    """
    Suggest secure alternative for vulnerable code.
    """
    # Use our scanner's fix generation
    result = scan_code(vulnerable_code, language)
    fixed_code = result.generate_fix()

    return {
        "secure_code": fixed_code,
        "explanation": f"Fixed {len(result.violations)} security issues",
        "changes": result.get_diff()
    }
```

### 5. Start NeMo Server with Our Config

```bash
# Start NeMo Guardrails server with our config
nemoguardrails server --config=./config/klyntos-guard-config.yml

# Server will run on http://localhost:8000
# Chat UI available at http://localhost:8000/
```

### 6. Integrate with Our Dashboard

Add guardrails page to our Next.js dashboard:

```tsx
// web/src/app/guardrails/page.tsx

export default function GuardrailsPage() {
  return (
    <div>
      {/* Embed NeMo Chat UI */}
      <iframe
        src="http://localhost:8000/"
        width="100%"
        height="800px"
      />

      {/* Or build custom UI calling NeMo API */}
      <GuardrailsChat />
    </div>
  )
}
```

## Workflow Example

### User asks AI to generate authentication code:

1. **User Prompt**: "Write me login code with username and password"

2. **Input Rails** (NeMo checks):
   - Is this a security-related request? ✅
   - Is language specified? Check context
   - Add security guidelines to prompt

3. **LLM Generates Code**:
   ```python
   def login(username, password):
       user = User.query.filter_by(username=username, password=password).first()
       return user
   ```

4. **Output Rails** (NeMo + Our Scanner):
   - NeMo calls `validate_code()` action
   - Our scanner detects: ❌ Plain-text password storage
   - Our scanner detects: ❌ SQL injection vulnerability

5. **Guardrails Intervenes**:
   - Blocks insecure code from being returned
   - Calls `suggest_secure_alternative()`
   - Returns secure version instead:

   ```python
   from werkzeug.security import check_password_hash

   def login(username, password):
       user = User.query.filter_by(username=username).first()
       if user and check_password_hash(user.password_hash, password):
           return user
       return None
   ```

6. **User Receives**:
   - ✅ Secure code
   - 📚 Explanation of what was fixed
   - 🎓 Educational message about password security

## File Structure

```
KlyntosGuard/
├── nemo-guardrails/          # Cloned NeMo repo
│   └── ...                   # Keep up to date with upstream
│
├── config/                   # Our NeMo configs
│   ├── klyntos-guard-config.yml
│   └── rails/
│       ├── code_security.co  # Code security flows
│       ├── sql_injection.co  # SQL-specific rails
│       ├── xss_prevention.co # XSS-specific rails
│       └── auth_flows.co     # Authentication flows
│
├── actions/                  # Custom NeMo actions
│   ├── __init__.py
│   ├── code_security.py      # validate_code, suggest_fix
│   └── scanner_bridge.py     # Bridge to our scanner
│
├── cli/                      # Our existing scanner
│   └── klyntos_guard/
│       └── commands/
│           └── scan.py       # Used by NeMo actions!
│
└── web/                      # Dashboard
    └── src/app/
        ├── scans/            # Scanner results
        └── guardrails/       # NeMo chat UI
```

## MCP Server Integration (Phase 2)

After NeMo is working, wrap it in MCP server:

```python
# mcp/server.py

from nemoguardrails import LLMRails, RailsConfig
from mcp import Server

# Load our KlyntosGuard config
config = RailsConfig.from_path("./config")
rails = LLMRails(config)

# MCP server exposes tools to Claude Code/Cursor
server = Server()

@server.tool("generate_secure_code")
async def generate_secure_code(prompt: str, language: str):
    """Generate code with security guardrails"""
    completion = await rails.generate_async(
        messages=[{
            "role": "user",
            "content": f"Generate {language} code: {prompt}"
        }]
    )
    return completion["content"]

# Claude Code connects to this MCP server
# When user asks for code, it goes through guardrails!
```

## Benefits

### 1. Proven System
- NeMo is battle-tested by NVIDIA
- Active development and community
- Comprehensive documentation

### 2. Our Unique Value-Add
- **Code Security Focus**: NeMo is general-purpose, we specialize in code
- **Scanner Integration**: Execution rails use our scanner
- **Combined Platform**: Guardrails + Scanner in one dashboard
- **MCP Integration**: Works with Claude Code/Cursor/Windsurf

### 3. Time Savings
- Don't rebuild guardrails from scratch
- Get chat UI for free
- Focus on our differentiator (code security)

## Timeline

### Week 1: NeMo Setup
- [x] Clone NeMo Guardrails
- [ ] Install and test locally
- [ ] Create basic code security config
- [ ] Implement `validate_code()` action
- [ ] Test with simple examples

### Week 2: Custom Rails for Code
- [ ] Create Colang flows for code security
- [ ] SQL injection prevention rails
- [ ] XSS prevention rails
- [ ] Authentication security rails
- [ ] Secret detection rails

### Week 3: Dashboard Integration
- [ ] Embed NeMo chat UI in dashboard
- [ ] Unified view: scans + guardrails
- [ ] Event logging and analytics
- [ ] Production deployment

### Week 4: MCP Server
- [ ] Wrap NeMo in MCP server
- [ ] Test with Claude Code
- [ ] Submit to MCP marketplace
- [ ] Documentation and examples

## Next Steps

1. **Install NeMo**: `pip install nemoguardrails`
2. **Test Basic Example**: Verify NeMo works
3. **Create Code Security Config**: Our first guardrails
4. **Implement validate_code Action**: Bridge to scanner
5. **Test End-to-End**: Generate code with guardrails

---

**Status**: Ready to integrate! NeMo provides the perfect foundation for our guardrails system. 🚀
