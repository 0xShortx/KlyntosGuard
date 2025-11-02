# What Users Can Do with KlyntosGuard

Complete guide to all KlyntosGuard features and capabilities.

---

## 🎯 Core Features (Live & Working)

### 1. **Sign Up & Authentication**

✅ **Available at**: https://guard.klyntos.com

- **Email/Password Signup** - Create account with email
- **Google OAuth** - Sign in with Google
- **GitHub OAuth** - Sign in with GitHub
- **Cross-subdomain Sessions** - Stay logged in across guard.klyntos.com and docs
- **Password Reset** - Forgot password recovery
- **Email Verification** - Verify email address

**Routes:**
- `/signup` - Create new account
- `/login` - Sign in to existing account
- `/welcome` - First-time user onboarding

---

### 2. **Dashboard** ✅

**Available at**: https://guard.klyntos.com/dashboard

**Features:**
- **Account Overview** - See your plan (Basic/Pro)
- **Scan Usage** - Track scans used vs. limit
- **API Key Management** - View/create CLI keys
- **Quick Links** - Access docs, pricing, settings

**What Users See:**
```
Welcome back, user@example.com!

Plan: Basic (Free)
Scans Used: 3 / 10 this month

✅ API Key: kg_****1234 (Created 2 days ago)

Quick Actions:
→ View Documentation
→ Generate New API Key
→ Upgrade to Pro
```

---

### 3. **API Key Generation** ✅

**Available at**: https://guard.klyntos.com/settings/cli

**Features:**
- **Generate CLI Keys** - Create `kg_` prefixed API keys
- **Exchange Tokens** - Convert temporary tokens to permanent keys
- **View All Keys** - List all your active API keys
- **Key Metadata** - See when keys were created

**API Endpoints:**
- `POST /api/cli/generate-key` - Create new key
- `GET /api/cli/keys` - List user's keys
- `POST /api/cli/verify-key` - Validate key
- `POST /api/cli/auth/exchange` - Exchange temp token for key

**Example:**
```bash
# In dashboard, click "Generate API Key"
# Get: kg_1234567890abcdef

# Use in CLI:
export KLYNTOS_GUARD_API_KEY="kg_1234567890abcdef"
kg scan myfile.py
```

---

### 4. **Code Scanning API** ✅

**Available at**: `POST https://guard.klyntos.com/api/v1/scan`

**Features:**
- **AI-Powered Analysis** - Claude 3.5 Sonnet (Haiku for Basic, Opus for Pro)
- **Multi-Language Support** - Python, JavaScript, TypeScript, Java, Go, etc.
- **Vulnerability Detection** - Secrets, SQL injection, XSS, etc.
- **Severity Levels** - Critical, High, Medium, Low, Info
- **Usage Tracking** - Automatic scan counting
- **Rate Limiting** - Based on subscription tier

**Request Format:**
```json
POST /api/v1/scan
Authorization: Bearer kg_your_api_key

{
  "code": "import os\nAPI_KEY = 'sk-123'",
  "language": "python",
  "filename": "app.py",
  "policies": ["secrets", "sql_injection"],
  "model": "opus",  // Pro only
  "depth": "deep"   // Pro only
}
```

**Response Format:**
```json
{
  "violations": [
    {
      "line": 2,
      "column": 11,
      "severity": "critical",
      "category": "secrets_detection",
      "message": "Hardcoded API key detected",
      "suggestion": "Move to environment variable",
      "code_snippet": "API_KEY = 'sk-123'"
    }
  ],
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "scan_time_ms": 1234
}
```

---

### 5. **Subscription Management** ✅

**Available at**: https://guard.klyntos.com/pricing

**Features:**
- **View Plans** - See Basic (Free) vs Pro ($49/month)
- **Upgrade to Pro** - Stripe Checkout integration
- **Manage Subscription** - Customer portal
- **Cancel Anytime** - Self-service cancellation
- **Usage Tracking** - Real-time scan counting

**Plans:**

**Basic (Free):**
- 10 scans/month
- Claude 3.5 Haiku
- Community support
- Basic policies
- CLI access

**Pro ($49/month):**
- Unlimited scans
- Claude 3 Opus
- Priority support
- All policies
- Deep analysis mode
- Custom policies
- Team features

**API Endpoints:**
- `POST /api/subscriptions/checkout` - Create checkout session
- `GET /api/subscriptions/status` - Check subscription
- `POST /api/subscriptions/portal` - Access customer portal
- `POST /api/webhooks/stripe` - Handle Stripe events

---

### 6. **Documentation** ✅

**Available at**: https://documentation.klyntos.com (or Vercel temp URL)

**Sections:**
- Getting Started (Installation, Quick Start)
- CLI Reference (All commands)
- User Guides (Configuration)
- Security Policies (Vulnerability types)
- API Reference (REST API, Python SDK)
- Advanced Topics (Custom policies)
- Integrations (GitHub Actions, VS Code)
- Security (Guidelines)
- Reference (FAQ, Glossary)

**23 pages total** - fully searchable

---

## 🚧 Features (Documented but Not Yet Built)

These are documented in the docs but not yet implemented:

### CLI Tool (`kg` command)
- File scanning
- Directory scanning
- Auto-fix suggestions
- Policy management
- Configuration management

### Python SDK
- `GuardClient` class
- Programmatic scanning
- Batch operations

### IDE Extensions
- VS Code extension
- Cursor integration
- PyCharm plugin

### Advanced Features
- Custom policies
- Webhooks
- Team collaboration
- Scan history
- Report exports

---

## 📊 What Users Can Actually Do RIGHT NOW

### ✅ Step 1: Sign Up
```
1. Go to https://guard.klyntos.com/signup
2. Create account (email or OAuth)
3. Verify email
4. Log in
```

### ✅ Step 2: Get API Key
```
1. Go to https://guard.klyntos.com/settings/cli
2. Click "Generate API Key"
3. Copy key (kg_xxxxx)
4. Save securely
```

### ✅ Step 3: Scan Code via API
```bash
curl -X POST https://guard.klyntos.com/api/v1/scan \
  -H "Authorization: Bearer kg_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import os\npassword = \"hardcoded123\"",
    "language": "python",
    "filename": "app.py"
  }'
```

### ✅ Step 4: View Results
```json
{
  "violations": [
    {
      "line": 2,
      "severity": "critical",
      "category": "secrets_detection",
      "message": "Hardcoded password detected"
    }
  ]
}
```

### ✅ Step 5: Upgrade to Pro (Optional)
```
1. Go to https://guard.klyntos.com/pricing
2. Click "Upgrade to Pro"
3. Complete Stripe checkout
4. Get unlimited scans + Claude Opus
```

---

## 🔮 Roadmap (What's Coming)

### Phase 1: CLI Tool (Priority)
- [ ] `kg` command installation
- [ ] File/directory scanning
- [ ] Auto-fix generation
- [ ] Configuration file support

### Phase 2: Web Features
- [ ] Scan history in dashboard
- [ ] Report viewing/export
- [ ] Team management
- [ ] Usage analytics

### Phase 3: Integrations
- [ ] GitHub Actions
- [ ] VS Code extension
- [ ] GitLab CI
- [ ] Pre-commit hooks

### Phase 4: Enterprise
- [ ] SSO/SAML
- [ ] On-premise deployment
- [ ] Custom policies
- [ ] Webhook integrations

---

## 💡 Use Cases Users Can Do TODAY

### 1. **Pre-Commit Security Check**
```bash
# Before committing code
curl -X POST https://guard.klyntos.com/api/v1/scan \
  -H "Authorization: Bearer $KLYNTOS_GUARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$(cat myfile.py)\", \"language\": \"python\"}"
```

### 2. **CI/CD Integration**
```yaml
# .github/workflows/security.yml
- name: Security Scan
  run: |
    curl -X POST https://guard.klyntos.com/api/v1/scan \
      -H "Authorization: Bearer ${{ secrets.KLYNTOS_GUARD_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d "{\"code\": \"$(cat app.py)\"}"
```

### 3. **API Integration**
```python
import requests

def scan_code(code, api_key):
    response = requests.post(
        "https://guard.klyntos.com/api/v1/scan",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"code": code, "language": "python"}
    )
    return response.json()

result = scan_code(my_code, "kg_your_key")
print(f"Found {len(result['violations'])} issues")
```

---

## 📈 Current Limitations

### Free Plan Limits:
- ❌ Only 10 scans/month
- ❌ Claude Haiku (less powerful)
- ❌ No deep analysis mode
- ❌ Basic policies only

### Pro Plan Benefits:
- ✅ Unlimited scans
- ✅ Claude Opus (most powerful)
- ✅ Deep analysis mode
- ✅ All 100+ policies
- ✅ Priority support

### Platform Limitations:
- ❌ No CLI tool yet (API only)
- ❌ No web-based scanning UI
- ❌ No scan history view
- ❌ No report exports
- ❌ No IDE extensions yet

---

## 🎯 Summary

**What Users CAN Do:**
1. ✅ Create account & authenticate
2. ✅ Generate API keys
3. ✅ Scan code via REST API
4. ✅ Get vulnerability reports
5. ✅ Upgrade to Pro subscription
6. ✅ Access comprehensive docs

**What Users CANNOT Do Yet:**
1. ❌ Use `kg` CLI command
2. ❌ View scan history in dashboard
3. ❌ Export reports
4. ❌ Use IDE extensions
5. ❌ Create custom policies (UI)
6. ❌ Team collaboration features

**Bottom Line:**
KlyntosGuard is a **working API-based security scanner** with authentication, subscriptions, and AI analysis. The CLI tool and advanced features are documented but not yet implemented.

---

**Next Priority:** Build the `kg` CLI tool so users can actually run `kg scan myfile.py` from the command line!
