# KlyntosGuard - Guardrails Implementation Plan

## Vision: Hybrid Security Platform

KlyntosGuard will be **BOTH**:
1. **Code Scanner** (✅ Already built) - Scans existing code for vulnerabilities
2. **AI Guardrails** (🔨 To build) - Prevents AI from writing vulnerable code

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   KlyntosGuard Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │Code Scanner  │              │  Guardrails  │            │
│  │(Reactive)    │              │ (Proactive)  │            │
│  └──────────────┘              └──────────────┘            │
│         │                              │                    │
│         ▼                              ▼                    │
│  ┌──────────────────────────────────────────────┐          │
│  │        Unified Dashboard & API               │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component 1: Code Scanner (✅ Already Built)

### What It Does:
- Scans existing code files
- Detects SQL injection, XSS, CSRF, etc.
- Provides fix suggestions
- CLI: `kg scan myfile.py`
- Dashboard shows scan history

### Status: **COMPLETE**

---

## Component 2: AI Guardrails (🔨 To Build)

Based on NVIDIA NeMo Guardrails architecture.

### Core Concept:

**Guardrails intercept AI code generation in real-time and prevent vulnerable patterns from being suggested.**

### Integration Points:

1. **MCP Server** (Model Context Protocol)
   - Claude Code, Cursor, Windsurf connect to our MCP server
   - We intercept code generation requests
   - Apply guardrails before returning to IDE

2. **API Middleware**
   - Developers call our API before sending to LLM
   - We validate/transform prompts and responses
   - Return safe, compliant outputs

### Five Types of Rails (Like NVIDIA NeMo):

#### 1. Input Rails
**Purpose**: Validate code generation requests

**Examples**:
- **Prompt Safety**: Block requests asking AI to write SQL injection
- **Context Validation**: Ensure proper security context is provided
- **Intent Classification**: Understand what developer is trying to build

```python
# Input Rail Example
class PromptSafetyRail:
    def validate(self, prompt: str) -> RailResult:
        if "write code to bypass authentication" in prompt.lower():
            return RailResult(
                allowed=False,
                message="Cannot assist with bypassing security",
                alternative="Would you like help implementing secure authentication?"
            )
        return RailResult(allowed=True)
```

#### 2. Dialog Rails
**Purpose**: Guide conversation toward secure patterns

**Examples**:
- **Security Steering**: Redirect toward secure implementations
- **Best Practice Suggestions**: Proactively suggest secure alternatives
- **Educational Moments**: Explain why certain approaches are insecure

```python
# Dialog Rail Example
class SecuritySteeringRail:
    def process(self, context: ConversationContext) -> DialogAction:
        if context.topic == "database_query" and not context.has_parameterization:
            return DialogAction(
                type="suggest",
                message="I recommend using parameterized queries to prevent SQL injection",
                code_example="cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))"
            )
```

#### 3. Retrieval Rails (RAG)
**Purpose**: Filter retrieved code examples

**Examples**:
- **Code Quality Filter**: Only retrieve secure code examples
- **Vulnerability Detection**: Block retrieval of vulnerable patterns
- **Source Verification**: Ensure examples are from trusted sources

```python
# Retrieval Rail Example
class SecureExampleRail:
    def filter_chunks(self, chunks: List[CodeChunk]) -> List[CodeChunk]:
        safe_chunks = []
        for chunk in chunks:
            scan_result = scan_code(chunk.code)
            if scan_result.is_safe:
                safe_chunks.append(chunk)
            else:
                # Replace with secure version
                safe_chunks.append(chunk.make_secure())
        return safe_chunks
```

#### 4. Execution Rails
**Purpose**: Validate generated code before returning

**Examples**:
- **Code Scanning**: Run our scanner on generated code
- **Pattern Matching**: Block known vulnerable patterns
- **Compliance Checking**: Ensure code meets standards

```python
# Execution Rail Example
class CodeScanRail:
    def validate(self, generated_code: str, language: str) -> RailResult:
        # Use our existing scanner!
        scan_result = scan_code(generated_code, language)

        if scan_result.has_critical_issues():
            return RailResult(
                allowed=False,
                issues=scan_result.violations,
                fixed_code=scan_result.generate_fix()
            )
        return RailResult(allowed=True, code=generated_code)
```

#### 5. Output Rails
**Purpose**: Post-process and validate final output

**Examples**:
- **Sensitive Data Removal**: Strip API keys, secrets
- **Comment Enhancement**: Add security warnings
- **Documentation**: Include security best practices

```python
# Output Rail Example
class SecretRemovalRail:
    def process(self, code: str) -> str:
        # Detect and remove secrets
        code = re.sub(r'API_KEY\s*=\s*["\'].*?["\']', 'API_KEY = os.getenv("API_KEY")', code)
        # Add warning comment
        code = "# ⚠️ Security: Always use environment variables for secrets\n" + code
        return code
```

---

## Implementation Phases

### Phase 1: Guardrails Engine Core (Week 1-2)

**Goal**: Build the core guardrails processing engine

**Tasks**:
1. Create `guardrails/` directory structure
2. Implement base `Rail` class
3. Build `GuardrailsEngine` that orchestrates rails
4. Implement 2-3 basic rails (input + output)
5. Unit tests for rail system

**Deliverables**:
- `guardrails/engine.py` - Core orchestration
- `guardrails/rails/base.py` - Base rail class
- `guardrails/rails/input/` - Input rails
- `guardrails/rails/output/` - Output rails
- Tests proving rails work

### Phase 2: MCP Server Integration (Week 3)

**Goal**: Build MCP server so Claude Code/Cursor can connect

**Tasks**:
1. Study MCP protocol specification
2. Implement MCP server endpoints
3. Create tool definitions for code generation
4. Integrate guardrails into MCP handlers
5. Test with Claude Code locally

**Deliverables**:
- `mcp/server.py` - MCP server implementation
- `mcp/tools/` - MCP tool definitions
- Working connection from Claude Code
- Demo: Claude Code uses guardrails

### Phase 3: Integration with Scanner (Week 4)

**Goal**: Execution rails use our existing scanner

**Tasks**:
1. Create execution rail that calls scanner
2. Implement auto-fix suggestions
3. Build feedback loop (scan → guardrail → rescan)
4. Dashboard shows both scans and guardrail events

**Deliverables**:
- `guardrails/rails/execution/code_scan_rail.py`
- Unified dashboard with both systems
- End-to-end flow: guardrails + scanner

### Phase 4: Advanced Rails (Week 5-6)

**Goal**: Implement sophisticated rails

**Tasks**:
1. Dialog rails for conversation steering
2. Retrieval rails for RAG scenarios
3. Context-aware rails (project-specific rules)
4. Machine learning-based rails

**Deliverables**:
- Full suite of 10+ rails
- Configuration system for rail composition
- Per-project guardrail policies

### Phase 5: Production & MCP Marketplace (Week 7-8)

**Goal**: Deploy and list on MCP marketplace

**Tasks**:
1. Production deployment of MCP server
2. Documentation for MCP integration
3. Submit to Anthropic MCP marketplace
4. Marketing materials
5. Example projects

**Deliverables**:
- guard.klyntos.com/mcp running
- Listed on MCP marketplace
- 5 example integrations
- Video tutorials

---

## Technical Architecture

### Directory Structure

```
KlyntosGuard/
├── cli/                    # Existing CLI (scanner)
│   └── klyntos_guard/
│       ├── commands/
│       │   ├── scan.py     # ✅ Existing scanner
│       │   ├── chat.py     # ✅ Existing chat
│       │   └── guard.py    # 🆕 New guardrails command
│       └── utils/
│
├── guardrails/             # 🆕 New guardrails system
│   ├── engine.py          # Core orchestration
│   ├── rails/
│   │   ├── base.py        # Base rail class
│   │   ├── input/
│   │   │   ├── prompt_safety.py
│   │   │   ├── context_validation.py
│   │   │   └── intent_classification.py
│   │   ├── dialog/
│   │   │   ├── security_steering.py
│   │   │   └── best_practices.py
│   │   ├── retrieval/
│   │   │   ├── secure_examples.py
│   │   │   └── source_verification.py
│   │   ├── execution/
│   │   │   ├── code_scan.py        # Uses existing scanner!
│   │   │   ├── pattern_matching.py
│   │   │   └── compliance.py
│   │   └── output/
│   │       ├── secret_removal.py
│   │       └── documentation.py
│   ├── config/
│   │   ├── rails.yaml     # Rail configuration
│   │   └── policies.yaml  # Security policies
│   └── utils/
│       ├── llm.py         # LLM interaction
│       └── vector_db.py   # For example retrieval
│
├── mcp/                    # 🆕 MCP server
│   ├── server.py          # MCP protocol handler
│   ├── tools/
│   │   ├── code_generation.py
│   │   ├── code_review.py
│   │   └── security_check.py
│   └── schemas/
│       └── mcp_protocol.py
│
└── web/                    # Existing dashboard
    └── src/
        └── app/
            ├── scans/      # ✅ Scanner results
            └── guardrails/ # 🆕 Guardrail events
```

### API Endpoints

**Existing (Scanner)**:
- `POST /api/v1/scan` - Scan code
- `GET /api/v1/scans` - List scans
- `GET /api/v1/scans/:id` - Scan details

**New (Guardrails)**:
- `POST /api/v1/guardrails/validate` - Validate prompt/code
- `POST /api/v1/guardrails/process` - Full guardrails pipeline
- `GET /api/v1/guardrails/events` - List guardrail events
- `WS /api/v1/guardrails/stream` - Real-time guardrails

**MCP Server**:
- `HTTP /mcp` - MCP protocol endpoint
- Tools exposed:
  - `generate_secure_code`
  - `review_code_security`
  - `check_vulnerabilities`

---

## Configuration Example

```yaml
# guardrails/config/rails.yaml

input_rails:
  - name: prompt_safety
    enabled: true
    severity: critical
    config:
      blocked_patterns:
        - "bypass authentication"
        - "disable security"
        - "SQL injection example"

  - name: context_validation
    enabled: true
    severity: high
    config:
      require_language: true
      require_framework: true

dialog_rails:
  - name: security_steering
    enabled: true
    config:
      suggest_alternatives: true
      educational: true
      examples_database: "secure_patterns"

execution_rails:
  - name: code_scan
    enabled: true
    severity: critical
    config:
      scanner: "klyntos_guard"
      fail_on: "high"
      auto_fix: true

  - name: secret_detection
    enabled: true
    severity: critical
    config:
      patterns:
        - api_key
        - password
        - token

output_rails:
  - name: documentation
    enabled: true
    config:
      add_security_comments: true
      add_best_practices: true
```

---

## Integration with Existing Scanner

The beauty of this hybrid approach:

**Execution Rail uses existing scanner:**

```python
# guardrails/rails/execution/code_scan.py

from cli.klyntos_guard.commands.scan import scan_code

class CodeScanRail(ExecutionRail):
    def validate(self, code: str, language: str) -> RailResult:
        # Use our EXISTING scanner!
        result = scan_code(code, language)

        if result.has_issues():
            # Guardrail blocks bad code
            return RailResult(
                allowed=False,
                reason="Security vulnerabilities detected",
                issues=result.violations,
                suggestion=result.generate_fix()
            )

        return RailResult(allowed=True)
```

**This means:**
- Guardrails prevent bad code from being suggested
- Scanner catches anything that slips through
- Both systems reinforce each other
- Same vulnerability database
- Unified reporting

---

## Next Steps

1. **✅ OAuth Fixed** - Google sign-in works now
2. **📋 This Plan** - Architecture documented
3. **🔨 Start Building** - Implement Phase 1 (Guardrails Engine)
4. **🧪 Test** - Prove guardrails work standalone
5. **🔗 MCP** - Build MCP server integration
6. **🚀 Launch** - Deploy and market

## Timeline

- **Week 1-2**: Guardrails engine core
- **Week 3**: MCP server
- **Week 4**: Scanner integration
- **Week 5-6**: Advanced rails
- **Week 7-8**: Production deployment

**Total**: 8 weeks to full hybrid system

---

## Success Criteria

**Phase 1 Complete When:**
- [ ] Guardrails engine processes prompts
- [ ] At least 3 rails implemented and tested
- [ ] Can block/modify code generation
- [ ] Unit tests pass

**Phase 2 Complete When:**
- [ ] MCP server accepts connections
- [ ] Claude Code can connect to our server
- [ ] Guardrails intercept code generation
- [ ] Demo video recorded

**Full System Complete When:**
- [ ] Both scanner and guardrails work together
- [ ] MCP server in production
- [ ] Listed on Anthropic MCP marketplace
- [ ] 10+ customers using it
- [ ] Documentation complete

---

## Questions to Answer

1. **Do we fork NVIDIA NeMo Guardrails or build from scratch?**
   - Pro fork: Proven architecture, community
   - Pro scratch: Full control, TypeScript/Python hybrid
   - **Recommendation**: Study NeMo, build our own with lessons learned

2. **MCP server in TypeScript or Python?**
   - Python: Matches our existing CLI
   - TypeScript: Better for Next.js integration
   - **Recommendation**: Python for now, TypeScript later

3. **How do rails access LLMs?**
   - Some rails need LLM for classification
   - Use Anthropic Claude Haiku (fast, cheap)
   - Cache rail results to reduce costs

4. **Vector database for examples?**
   - Need to store secure code patterns
   - Options: Pinecone, Weaviate, Chroma
   - **Recommendation**: Start with Chroma (local), migrate to Pinecone (prod)

---

**Status**: Ready to start Phase 1 🚀
