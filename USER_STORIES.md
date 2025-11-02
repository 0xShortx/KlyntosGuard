# KlyntosGuard User Stories

Complete real-world scenarios showing how different developers use KlyntosGuard.

---

## User Story 1: Terminal Power User (CLI Workflow)

### Profile: Sarah - Senior Backend Engineer
**Background**: Sarah codes in Neovim, prefers terminal workflows, and uses Claude Code in her editor. She's building a FastAPI service with PostgreSQL.

### Day 1: Setup (5 minutes)
```bash
# Morning: Start new project
cd ~/projects/payment-api
python -m venv venv
source venv/bin/activate

# Install KlyntosGuard CLI
pip install klyntos-guard

# Authenticate
kg auth login
# Opens browser → Logs in with Google
# ✓ Successfully authenticated! API key saved to ~/.klyntos/config
```

### Day 2: Coding Session (2 hours)
```bash
# Sarah codes all morning using Claude Code in her editor
# Claude Code generates database code for payment processing

# File: app/db/payments.py
def process_payment(user_id, amount):
    query = f"SELECT * FROM users WHERE id = {user_id}"  # ⚠️ SQL injection!
    result = db.execute(query)
    return result

# Sarah doesn't notice the vulnerability
```

### Pre-Commit Scan (30 seconds)
```bash
# Before committing, Sarah runs KlyntosGuard
kg scan . --recursive

# Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 KLYNTOS GUARD SECURITY SCAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scanning: /Users/sarah/projects/payment-api
Files: 23 | Languages detected: Python, TypeScript

⏳ Analyzing code with Claude 3.5 Sonnet...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ CRITICAL ISSUES FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 app/db/payments.py
   Line 7 | CRITICAL | SQL Injection

   ❌ Vulnerable code:
   query = f"SELECT * FROM users WHERE id = {user_id}"

   💡 Fix suggestion:
   Use parameterized queries:
   query = "SELECT * FROM users WHERE id = %s"
   result = db.execute(query, (user_id,))

   🔗 CWE-89: SQL Injection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files scanned: 23
Issues found: 1
  🔴 Critical: 1
  🟠 High: 0
  🟡 Medium: 0

❌ Scan failed - Critical issues must be fixed
```

### Fix & Verify (2 minutes)
```bash
# Sarah fixes the code
vim app/db/payments.py

# Fixed code:
def process_payment(user_id, amount):
    query = "SELECT * FROM users WHERE id = %s"
    result = db.execute(query, (user_id,))
    return result

# Re-scan
kg scan . -r

# Output:
✓ All files scanned successfully
✓ No vulnerabilities found
🎉 Your code is secure!

# Commit with confidence
git add .
git commit -m "feat: add payment processing with secure queries"
git push
```

### CI/CD Integration (one-time setup)
```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install KlyntosGuard
        run: pip install klyntos-guard

      - name: Run Security Scan
        env:
          KLYNTOS_GUARD_API_KEY: ${{ secrets.KLYNTOS_GUARD_API_KEY }}
        run: kg scan . -r --format sarif -o security-report.sarif

      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: security-report.sarif
```

### Result
- **Time saved**: 3 hours (would've taken 3+ hours to find in code review)
- **Security posture**: Critical SQL injection prevented before production
- **Workflow**: Seamless - just one command before commit
- **Cost**: $0.15 per scan (23 files × ~200 lines each)

---

## User Story 2: Web Dashboard User (GUI Workflow)

### Profile: Marcus - Full-Stack Developer
**Background**: Marcus uses VS Code with GitHub Copilot. He prefers visual interfaces and manages multiple client projects. Building a Next.js SaaS app.

### Monday Morning: New Client Project
```bash
# VS Code Terminal
cd ~/clients/acme-crm
npx create-next-app@latest .
```

**Marcus codes with GitHub Copilot all day:**
- Copilot generates authentication code
- Copilot creates API routes
- Copilot builds database queries

### End of Day: Dashboard Scan (GUI)

**1. Open Browser → Navigate to https://guard.klyntos.com**

**2. Login**
- Click "Sign in with Google"
- Select work account
- Redirected to dashboard

**3. Navigate to Scan Page**
- Click "Guardrails" in top menu
- Sees clean interface with 3-step workflow

**4. Enter Project Path**
```
Project Path: /Users/marcus/clients/acme-crm
```

**5. Click "START SCAN"**
- Loading animation shows progress
- Takes 15 seconds for 45 files

**6. View Results (Visual Cards)**
```
┌─────────────────────────────────────────────────────┐
│              SCAN RESULTS                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📁 45 Files    🔴 2 Critical    🟠 3 High         │
│                                                     │
│  ❌ CRITICAL ISSUES                                 │
│                                                     │
│  📄 src/app/api/auth/login/route.ts                │
│     Line 23 | Hardcoded Secret                     │
│                                                     │
│     const JWT_SECRET = "my-secret-key-123"         │
│                                                     │
│     💡 Use environment variables:                   │
│     const JWT_SECRET = process.env.JWT_SECRET      │
│                                                     │
│  📄 src/lib/db/users.ts                            │
│     Line 45 | SQL Injection                        │
│                                                     │
│     const query = `DELETE FROM users               │
│                    WHERE id = ${userId}`           │
│                                                     │
│     💡 Use parameterized queries:                   │
│     await db.query('DELETE FROM users              │
│                     WHERE id = $1', [userId])      │
│                                                     │
│  🟠 HIGH SEVERITY ISSUES                            │
│                                                     │
│  📄 src/app/api/upload/route.ts                    │
│     Line 67 | Path Traversal                       │
│     ...                                             │
│                                                     │
│  [VIEW DETAILED REPORT] [DOWNLOAD SARIF]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**7. Click "VIEW DETAILED REPORT"**
- Navigates to `/scans/scan_abc123`
- Shows full report with:
  - File tree (expandable)
  - Each issue with context (5 lines before/after)
  - Copy button for fix suggestions
  - Links to CWE database

**8. Fix Issues in VS Code**
- Marcus opens VS Code
- Fixes each issue by copying the suggestions
- Saves files

**9. Re-scan from Dashboard**
- Returns to browser
- Clicks "Scan Your Project" again
- Enters same path
- Clicks "START SCAN"

**Results:**
```
✅ ALL CLEAR

📁 45 Files Scanned
✓ 0 Critical
✓ 0 High
✓ 0 Medium
✓ 0 Low

🎉 Your codebase is secure!
```

**10. Save Report**
- Click "Download PDF"
- Email to client: "Security audit complete ✓"

### Weekly Routine
Marcus now scans every project before client demos:
1. Monday: Scan project A → Fix 2 issues
2. Wednesday: Scan project B → Clean ✓
3. Friday: Scan project C → Fix 1 hardcoded API key

### Dashboard Features Marcus Uses
- **Scan History**: See all past scans
- **Projects**: Save project paths for quick re-scan
- **API Keys**: Generate keys for CI/CD
- **Settings**: Configure scan policies (strict, moderate, relaxed)

### Result
- **Time saved**: 5 hours/week (would spend time in manual code review)
- **Client confidence**: Shows security reports to clients
- **Workflow**: Visual, no command line needed
- **Cost**: $2/week (3 scans × 45 files each)

---

## User Story 3: Team Lead with Hybrid Workflow

### Profile: Priya - Engineering Manager
**Background**: Manages team of 8 developers. Needs both CLI (for herself) and dashboard (for team). Building microservices architecture.

### Team Setup (One-time)

**1. Organization Dashboard**
```
guard.klyntos.com/org/acme-corp
```

**2. Invite Team Members**
- Add 8 developers
- Each gets email invite
- They sign up with Google/GitHub

**3. Configure Team Policies**
```
Policy: Strict
- Block commits with Critical issues
- Warn on High issues
- Track all scans in org dashboard

CI/CD Integration: Enabled
- GitHub Actions auto-scan on PR
- Slack notifications on issues
```

### Developer Workflow (CLI)

**Developer: Alex (Junior Dev)**
```bash
# Alex is coding a new microservice
cd ~/services/user-service

# Uses Claude Code to generate authentication
# Claude generates code with potential issues

# Before creating PR
kg scan . -r --policy strict

# Output shows 1 Critical issue
# Alex fixes it
# Re-scans → Clean
# Creates PR

# GitHub Actions automatically runs KlyntosGuard
# PR passes security check ✓
```

### Manager Workflow (Dashboard)

**Priya's Weekly Review**
1. Opens dashboard → "Team Overview"
2. Sees all scans from past week:

```
┌─────────────────────────────────────────┐
│  TEAM SECURITY DASHBOARD                │
├─────────────────────────────────────────┤
│                                         │
│  This Week: 47 scans                    │
│  Issues found: 12                       │
│  Issues fixed: 11                       │
│  🔴 1 Critical still open               │
│                                         │
│  BY DEVELOPER:                          │
│  Alex      | 8 scans  | 0 open issues  │
│  Maria     | 6 scans  | 1 critical ⚠️  │
│  Jordan    | 12 scans | 0 open issues  │
│  ...                                    │
│                                         │
│  COMMON ISSUES:                         │
│  • SQL Injection (5 instances)          │
│  • Hardcoded Secrets (4 instances)      │
│  • XSS (3 instances)                    │
│                                         │
│  📊 Training needed: SQL best practices │
│                                         │
└─────────────────────────────────────────┘
```

3. Clicks on Maria's critical issue
4. Sees it's in PR #234 for payment service
5. Leaves comment on PR: "Please fix SQL injection in payment.py:45"
6. Maria fixes → Re-scans → Merged

### Team Benefits
- **Automated**: Every PR scanned automatically
- **Visibility**: Manager sees all security issues
- **Training**: Identify patterns → Schedule training
- **Compliance**: Audit trail for SOC2

---

## User Story 4: Freelancer (Quick Scans)

### Profile: Jake - Freelance Developer
**Background**: Takes on small projects. Needs fast, affordable security scans. Builds WordPress plugins, Node.js apps.

### Project: WordPress Plugin (2 days)

**Day 1: Code**
```bash
# Build plugin with AI assistance
claude "Create a WordPress contact form plugin with database storage"

# Claude generates ~500 lines of PHP
```

**Day 2: Before Delivery**
```bash
# Install CLI
pip install klyntos-guard

# Authenticate
kg auth login

# Scan plugin
kg scan ./wp-contact-plugin -r

# Finds 3 issues:
# - SQL injection in form handler
# - XSS in form rendering
# - Missing CSRF token

# Fix all 3 issues (15 minutes)

# Re-scan
kg scan ./wp-contact-plugin -r
# ✓ Clean

# Export report for client
kg scan ./wp-contact-plugin -r --format pdf -o security-report.pdf
```

**Result:**
- **Cost**: $0.10 (small codebase)
- **Time**: 20 minutes total (scan + fixes)
- **Client value**: Shows security report → charges extra $200 for "security audit"
- **ROI**: 2000% return on scan cost

---

## Comparison: CLI vs Web Dashboard

### CLI Workflow
**Best for:**
- Terminal-focused developers
- CI/CD integration
- Batch scanning multiple projects
- Scripting and automation
- Offline work (with cached credentials)

**Commands:**
```bash
# Quick scan
kg scan .

# Recursive scan with SARIF export
kg scan . -r --format sarif -o report.sarif

# Scan specific files
kg scan src/auth/*.py

# Chat mode (interactive)
kg chat

# View scan history
kg scans list

# Get scan by ID
kg scans get scan_abc123
```

### Web Dashboard Workflow
**Best for:**
- Visual learners
- Team collaboration
- Non-technical stakeholders
- Detailed browsing of results
- Project management
- Generating reports for clients

**Features:**
- Drag & drop project folders
- Visual file tree explorer
- Color-coded severity levels
- One-click fix suggestions
- PDF/SARIF export
- Scan history with filters
- Team dashboards
- Billing & usage metrics

---

## Key Takeaways

### For Individual Developers
1. **Install once**: `pip install klyntos-guard`
2. **Scan before commit**: `kg scan . -r`
3. **Fix issues**: Use AI-generated suggestions
4. **Deploy confidently**: No vulnerabilities

### For Teams
1. **CI/CD integration**: Auto-scan every PR
2. **Dashboard visibility**: Manager sees all scans
3. **Training insights**: Identify common mistakes
4. **Compliance**: Audit trail for security

### For Freelancers
1. **Quick scans**: Before delivering to clients
2. **Professional reports**: PDF exports
3. **Upsell security**: Charge for "security audit"
4. **Low cost**: Pay only for what you scan

### Pricing Model
- **Free tier**: 10 scans/month (up to 100 files each)
- **Pro**: $29/month (unlimited scans, CI/CD, SARIF export)
- **Team**: $99/month (team dashboard, org policies, SSO)
- **Enterprise**: Custom (on-prem deployment, SLA)

---

## Real Impact

### Before KlyntosGuard
- ❌ SQL injection deployed to production → Database breach
- ❌ Hardcoded API key in GitHub → $5,000 AWS bill
- ❌ XSS vulnerability → User data stolen
- ❌ 3 hours of manual code review per feature
- ❌ Security audits cost $10,000+

### After KlyntosGuard
- ✅ Vulnerabilities caught before commit
- ✅ 30-second scans vs 3-hour reviews
- ✅ Automated security in CI/CD
- ✅ Audit trail for compliance
- ✅ Team training insights
- ✅ Client confidence with reports

---

**Next Steps:**
1. Try it now: `pip install klyntos-guard`
2. Scan your project: `kg scan . -r`
3. Or use web: https://guard.klyntos.com
4. Read docs: https://docs.klyntos.com
