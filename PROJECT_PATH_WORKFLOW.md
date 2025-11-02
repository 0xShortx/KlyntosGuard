# Project Path Workflow - How KlyntosGuard Scans Work

This document explains how users specify project paths and how the scanning actually works.

---

## Understanding "Project Path"

### What is a Project Path?

A **project path** is the **absolute file system path** to your codebase on your local machine or server.

**Examples:**
```bash
# macOS/Linux
/Users/sarah/projects/payment-api
/home/dev/workspace/ecommerce-site
/opt/apps/production/api-server

# Windows
C:\Users\Marcus\projects\acme-crm
D:\development\nodejs-app
```

### NOT a GitHub URL

❌ **WRONG:**
```
https://github.com/username/repo
git@github.com:username/repo.git
```

✅ **CORRECT:**
```
/Users/you/projects/local-clone-of-repo
```

**Why?** KlyntosGuard scans **local code** on your filesystem, not remote repositories.

---

## How It Actually Works

### Method 1: CLI Workflow (Recommended for Most Developers)

#### Step 1: Clone Your Repo Locally
```bash
# Clone from GitHub
cd ~/projects
git clone https://github.com/username/my-app.git
cd my-app
```

#### Step 2: Run KlyntosGuard CLI
```bash
# Scan current directory
kg scan .

# OR scan specific path
kg scan /Users/you/projects/my-app

# Recursive scan (scans all subdirectories)
kg scan . --recursive
```

#### What Happens:
1. CLI reads files from your **local filesystem**
2. Sends code to KlyntosGuard API (with your API key)
3. API forwards to Claude 3.5 Sonnet for analysis
4. Results returned to CLI
5. CLI displays results in terminal

**Example Output:**
```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 KLYNTOS GUARD SECURITY SCAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scanning: /Users/sarah/projects/payment-api
Files: 23 | Languages: Python, TypeScript

⏳ Analyzing code...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ CRITICAL ISSUES FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 app/db/payments.py
   Line 7 | CRITICAL | SQL Injection

   ❌ query = f"SELECT * FROM users WHERE id = {user_id}"

   💡 Fix: Use parameterized queries
   query = "SELECT * FROM users WHERE id = %s"
   db.execute(query, (user_id,))
```

---

### Method 2: Web Dashboard Workflow

#### Step 1: Clone Repo Locally (Same as CLI)
```bash
cd ~/projects
git clone https://github.com/username/my-app.git
```

#### Step 2: Open Dashboard
1. Go to https://guard.klyntos.com/guardrails (or http://localhost:3001/guardrails)
2. Login with Google/GitHub
3. Enter **absolute path** to your local project:
   ```
   /Users/marcus/projects/my-app
   ```
4. Click "START SCAN"

#### What Happens:
1. **Browser makes API request** to KlyntosGuard backend
2. **Backend server** reads files from **its own filesystem**
3. Backend sends code to Claude API
4. Results sent back to browser
5. Dashboard displays visual results

**Important:** For web dashboard, the project must be on the **server's filesystem**, not your local machine (unless server is localhost).

---

## Deployment Scenarios

### Scenario A: Development (Localhost)

**Setup:**
- KlyntosGuard server running on `localhost:3001`
- Your project at `/Users/you/projects/my-app`

**CLI Scan:**
```bash
cd /Users/you/projects/my-app
kg scan .
```

**Web Dashboard:**
1. Navigate to http://localhost:3001/guardrails
2. Enter: `/Users/you/projects/my-app`
3. Click scan

**Result:** ✅ Works because server and project are on same machine

---

### Scenario B: Production (Cloud Server)

**Setup:**
- KlyntosGuard deployed on Vercel/Railway
- Your project on your local machine

**CLI Scan (✅ Works):**
```bash
cd ~/projects/my-app
kg scan . --recursive
```
**How:** CLI reads local files → Sends to cloud API → Gets results

**Web Dashboard (❌ Won't Work):**
```
Enter path: /Users/you/projects/my-app
```
**Why fails:** Cloud server can't access your local filesystem

**Solution for Web Dashboard in Production:**
You have 3 options:

#### Option 1: GitHub Integration (Future Feature)
```
Enter GitHub URL: https://github.com/username/repo
Branch: main
```
Backend clones repo temporarily → Scans → Deletes clone

#### Option 2: Upload Zip File (Future Feature)
1. Zip your project locally
2. Upload via web dashboard
3. Server extracts → Scans → Deletes

#### Option 3: Use CLI Instead (Current Solution)
```bash
# Use CLI for scanning local projects
kg scan . -r

# View results in dashboard
kg scans list
```

---

## Current Implementation Status

### ✅ What Works Now (MVP)

**CLI Scanning:**
```bash
# Local scanning
kg scan /path/to/project -r

# Uploads code to API
# Gets results
# Saves to database
# Viewable in dashboard
```

**Web Dashboard:**
```bash
# Only works for localhost development
# Server scans files on its own filesystem
# Not suitable for production (can't access user's local files)
```

### 🔄 What Needs Building

**For Production Web Scanning:**

1. **GitHub Integration**
   - User enters GitHub URL
   - Backend uses GitHub API to fetch files
   - Scans without cloning

2. **File Upload**
   - User uploads .zip of project
   - Backend extracts to temp dir
   - Scans and cleans up

3. **Webhook Integration**
   - User installs GitHub App
   - Auto-scans on every push/PR
   - Comments results on PR

---

## Recommended Workflow by User Type

### For Individual Developers (Solo Projects)

**Best Approach: CLI**

```bash
# Daily workflow
cd ~/projects/my-app

# Code with AI assistants
code .  # VS Code + Claude Code

# Before commit
kg scan . -r

# If clean, commit
git add .
git commit -m "feat: add feature"
git push
```

**Why CLI:**
- Works on local machine
- No server needed
- Fastest workflow
- Integrates with git hooks

---

### For Teams (Multiple Developers)

**Best Approach: CI/CD Integration**

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  klyntos-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Scan with KlyntosGuard
        env:
          KLYNTOS_GUARD_API_KEY: ${{ secrets.KLYNTOS_GUARD_API_KEY }}
        run: |
          pip install klyntos-guard
          kg scan . -r --format sarif -o report.sarif

      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: report.sarif
```

**How It Works:**
1. Developer pushes code to GitHub
2. GitHub Actions runner checks out code
3. Runner has **local copy** of code
4. CLI scans local copy
5. Results uploaded to GitHub Security tab
6. PR blocked if critical issues found

---

### For Freelancers (Client Projects)

**Best Approach: CLI + PDF Export**

```bash
# Before delivering to client
cd ~/clients/acme-crm

# Run scan
kg scan . -r

# Export professional report
kg scan . -r --format pdf -o security-audit.pdf

# Email to client
# Charge extra for "security audit"
```

---

## File System Permissions

### What KlyntosGuard Needs

**CLI Scanning:**
- ✅ Read access to project directory
- ✅ Read access to all source files
- ❌ NO write access needed
- ❌ NO execute permissions needed

**Web Dashboard (localhost):**
- ✅ Same as CLI
- ⚠️ Server process must have read permissions

**Example:**
```bash
# Check permissions
ls -la /Users/you/projects/my-app

# If permission denied
chmod -R u+r /Users/you/projects/my-app
```

---

## Security Considerations

### What Gets Sent to API

**When you run `kg scan .`:**

1. **Files are read locally**
2. **Code content is sent** to KlyntosGuard API
3. **API forwards to Claude API** for analysis
4. **Results stored** in your account database
5. **Original code NOT stored** (only scan results)

### Data Privacy

**What we store:**
- ✅ Scan results (vulnerabilities found)
- ✅ File names and line numbers
- ✅ Code snippets (5 lines context around issues)
- ❌ Full source code
- ❌ Secrets or credentials

**Encryption:**
- All API requests over HTTPS
- API keys hashed in database
- Results encrypted at rest

---

## Common Questions

### Q: Can I scan a GitHub repo directly without cloning?

**Current:** ❌ No, you must clone locally first

**Future:** ✅ Yes, we're building GitHub integration
```bash
# Future feature
kg scan --github https://github.com/user/repo
```

### Q: Can I scan a private repo?

**Yes!** The scan happens **locally on your machine**, so:
```bash
# Clone private repo
git clone git@github.com:yourcompany/private-app.git
cd private-app

# Scan works normally
kg scan . -r
```

### Q: What files get scanned?

**Scanned:**
- Source code files (.py, .js, .ts, .go, .rs, .java, etc.)
- Configuration files (.env, config.yml)
- SQL files (.sql)

**Ignored (by default):**
- `node_modules/`
- `.git/`
- `venv/`, `env/`
- `dist/`, `build/`
- Binary files
- Images, videos

**Custom ignore:**
```bash
# Create .klyntosignore
echo "tests/" >> .klyntosignore
echo "*.test.js" >> .klyntosignore

kg scan . -r  # Respects .klyntosignore
```

### Q: How long does scanning take?

**Depends on project size:**
- Small (10-50 files): **5-15 seconds**
- Medium (50-200 files): **30-60 seconds**
- Large (200-1000 files): **2-5 minutes**
- Very large (1000+ files): **5-15 minutes**

**Optimization:**
```bash
# Scan only specific directories
kg scan src/ -r

# Scan only changed files
git diff --name-only | xargs kg scan
```

### Q: Does it work with monorepos?

**Yes!**
```bash
# Scan entire monorepo
kg scan . -r

# Or scan specific package
kg scan packages/backend -r
kg scan apps/web -r
```

---

## Example: Complete Developer Workflow

### Sarah - Backend Engineer

**Monday Morning:**
```bash
# Start new feature
cd ~/projects/payment-api
git checkout -b feat/stripe-integration

# Code with Claude Code
code .

# Claude generates Stripe payment code
# (includes some vulnerable patterns)
```

**Monday Afternoon:**
```bash
# Before committing
kg scan . -r

# Output shows issues:
# ❌ Hardcoded API key in config.py
# ❌ SQL injection in payment_db.py

# Fix issues
vim src/config.py      # Move API key to .env
vim src/payment_db.py  # Use parameterized queries

# Re-scan
kg scan . -r
# ✅ All clear!

# Commit
git add .
git commit -m "feat: add Stripe integration with secure API handling"
git push origin feat/stripe-integration
```

**GitHub Actions runs automatically:**
```
✓ Tests passed
✓ Linting passed
✓ KlyntosGuard scan passed
→ PR approved
```

---

## Summary

### Current Model (MVP)

**How it works:**
1. Code lives on **your local machine**
2. You clone repos locally
3. You run `kg scan .` via **CLI**
4. CLI reads local files
5. CLI sends to API
6. Results displayed in terminal
7. Results also saved to database
8. Viewable in web dashboard

**Web dashboard:**
- Shows scan history
- Shows detailed results
- Generate reports
- Manage API keys
- **But cannot scan remote projects** (only localhost)

### Future Enhancements

1. **GitHub Integration**: Scan repos without cloning
2. **File Upload**: Scan via web without CLI
3. **Webhook Automation**: Auto-scan on every push
4. **VS Code Extension**: Scan inside your editor
5. **Pre-commit Hook**: Block commits with issues

---

**For now, the recommended workflow is:**

1. Clone repo locally
2. Use CLI for scanning
3. Use dashboard for viewing results and generating reports

This gives you the best experience while we build the advanced integrations.
