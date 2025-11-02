# KlyntosGuard - End-to-End Testing Guide

**Date**: November 2, 2025
**Status**: ✅ Ready for Testing

## System Status

### Infrastructure
- ✅ Dev server running on http://localhost:3001
- ✅ Database connected (Neon PostgreSQL)
- ✅ All migrations applied successfully
- ✅ GitHub OAuth configured
- ✅ Google OAuth configured
- ✅ Better Auth handler active

### Database Tables Verified
```
✅ user                         - User accounts
✅ session                      - User sessions
✅ account                      - OAuth accounts
✅ verification                 - Email verification
✅ guard_api_keys              - API keys for CLI/integrations
✅ guard_scans                 - Scan results and history
✅ guard_github_repositories   - GitHub repo configurations
✅ guard_subscriptions         - Payment subscriptions
✅ guard_token_usage           - LLM token tracking
✅ guard_usage                 - Usage metrics
✅ guard_vulnerabilities       - Detected security issues
```

---

## Test 1: Email/Password Authentication

### 1.1 Sign Up with Email/Password

**URL**: http://localhost:3001/signup

**Steps**:
1. Navigate to http://localhost:3001/signup
2. Fill in the form:
   - **Name**: Test User
   - **Email**: test@klyntos.com
   - **Password**: TestPassword123!
3. Click "Create Account"

**Expected Result**:
- ✅ User account created in database
- ✅ Redirected to /guardrails page
- ✅ Session cookie set
- ✅ User sees dashboard

**Verify in Database**:
```sql
SELECT id, name, email, created_at
FROM "user"
WHERE email = 'test@klyntos.com';
```

### 1.2 Sign In with Email/Password

**URL**: http://localhost:3001/login

**Steps**:
1. Navigate to http://localhost:3001/login
2. Enter credentials:
   - **Email**: test@klyntos.com
   - **Password**: TestPassword123!
3. Click "Sign In"

**Expected Result**:
- ✅ Successfully authenticated
- ✅ Redirected to /guardrails
- ✅ New session created in database

**Verify in Database**:
```sql
SELECT s.id, s.user_id, s.expires_at, u.email
FROM session s
JOIN "user" u ON s.user_id = u.id
WHERE u.email = 'test@klyntos.com'
ORDER BY s.created_at DESC
LIMIT 1;
```

### 1.3 Sign Out

**Steps**:
1. While logged in, click "Sign Out" in header
2. Verify redirected to login page
3. Try to access /guardrails while logged out

**Expected Result**:
- ✅ Session deleted from database
- ✅ Redirected to /login
- ✅ /guardrails page requires login

---

## Test 2: GitHub OAuth Authentication

### 2.1 Sign Up with GitHub

**URL**: http://localhost:3001/login

**Steps**:
1. Navigate to http://localhost:3001/login
2. Click "Continue with GitHub" button
3. Authorize the app on GitHub
4. Get redirected back to app

**Expected Result**:
- ✅ User created with GitHub account
- ✅ Account record created linking GitHub
- ✅ Redirected to /guardrails
- ✅ GitHub access token stored for repo scanning

**GitHub OAuth Configuration**:
```
Client ID: Ov23li4I5y428iXfUO5C
Callback URL: http://localhost:3001/api/auth/callback/github
Scopes: user:email, read:user, repo
```

**Verify in Database**:
```sql
-- Check user was created
SELECT id, name, email, created_at FROM "user" ORDER BY created_at DESC LIMIT 1;

-- Check GitHub account was linked
SELECT
    a.provider,
    a.provider_account_id,
    a.access_token IS NOT NULL as has_token,
    a.scope,
    u.email
FROM account a
JOIN "user" u ON a.user_id = u.id
WHERE a.provider = 'github'
ORDER BY a.created_at DESC
LIMIT 1;
```

### 2.2 Sign In with Existing GitHub Account

**Steps**:
1. Sign out if logged in
2. Click "Continue with GitHub"
3. Should recognize existing account

**Expected Result**:
- ✅ Uses existing user record
- ✅ No duplicate accounts created
- ✅ Session created successfully

---

## Test 3: Google OAuth Authentication

### 3.1 Sign Up with Google

**URL**: http://localhost:3001/login

**Steps**:
1. Navigate to http://localhost:3001/login
2. Click "Continue with Google" button
3. Select Google account
4. Get redirected back to app

**Expected Result**:
- ✅ User created with Google account
- ✅ Account record created linking Google
- ✅ Redirected to /guardrails

**Google OAuth Configuration**:
```
Client ID: 247462053883-ckt0bvur9qb96pbmgjtmn9ojupl1as7d.apps.googleusercontent.com
Callback URL: http://localhost:3001/api/auth/callback/google
```

**Verify in Database**:
```sql
SELECT
    a.provider,
    a.provider_account_id,
    u.email,
    u.name
FROM account a
JOIN "user" u ON a.user_id = u.id
WHERE a.provider = 'google'
ORDER BY a.created_at DESC
LIMIT 1;
```

---

## Test 4: Account Linking (Same Email, Different Providers)

### Test Scenario

Better Auth is configured with `account.accountLinking.enabled = true`, which allows users to:
- Sign up with GitHub using email@example.com
- Later sign in with Google using the same email@example.com
- Both OAuth accounts link to the same user record

### 4.1 Link Multiple Providers

**Steps**:
1. Sign up with GitHub using your email
2. Sign out
3. Sign in with Google using the SAME email
4. Check database

**Expected Result**:
- ✅ Only ONE user record created
- ✅ TWO account records (one for GitHub, one for Google)
- ✅ Both accounts reference same user_id

**Verify in Database**:
```sql
SELECT
    u.id,
    u.email,
    u.name,
    COUNT(a.id) as account_count,
    STRING_AGG(a.provider, ', ') as providers
FROM "user" u
LEFT JOIN account a ON u.id = a.user_id
WHERE u.email = 'your-email@example.com'
GROUP BY u.id, u.email, u.name;
```

---

## Test 5: GitHub Repository Scanning

### 5.1 Scan Public Repository via URL

**URL**: http://localhost:3001/guardrails

**Steps**:
1. Log in with any method
2. Navigate to /guardrails
3. Select "GitHub URL" scan type
4. Enter a public repo URL: `https://github.com/klyntos/demo-repo`
5. Click "Scan Repository"

**Expected Result**:
- ✅ Scan initiated successfully
- ✅ Scan record created in `guard_scans` table
- ✅ Results displayed after completion
- ✅ Vulnerabilities stored in `guard_vulnerabilities` table

**Verify in Database**:
```sql
-- Check scan was created
SELECT
    id,
    type,
    github_url,
    status,
    created_at
FROM guard_scans
WHERE user_id = (SELECT id FROM "user" WHERE email = 'your-email@example.com')
ORDER BY created_at DESC
LIMIT 1;

-- Check vulnerabilities found
SELECT
    v.severity,
    v.category,
    v.message,
    v.file_path,
    v.line_number
FROM guard_vulnerabilities v
WHERE scan_id = 'YOUR_SCAN_ID'
ORDER BY
    CASE v.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    v.file_path;
```

### 5.2 Scan via GitHub OAuth (User's Repositories)

**Requirements**: Must be logged in via GitHub OAuth

**Steps**:
1. Log in with GitHub
2. Navigate to /guardrails
3. Select "My Repositories" scan type
4. Click "Connect GitHub" (if needed)
5. Select a repository from dropdown
6. Click "Scan Repository"

**Expected Result**:
- ✅ User's repos fetched using GitHub access token
- ✅ Private repos accessible (if authorized)
- ✅ Scan uses stored access token

---

## Test 6: GitHub Webhooks (Auto-Scan on Push)

### 6.1 Set Up Webhook

**Pre-requisites**:
- Repository on GitHub
- Logged in with GitHub OAuth
- ngrok or public URL

**Get ngrok URL**:
```bash
# Check if ngrok is running
lsof -i:4040

# Or start new ngrok tunnel
ngrok http 3001
```

**Steps**:
1. Log in with GitHub
2. Navigate to /guardrails
3. Select a repository
4. Click "Enable Auto-Scan"
5. Copy the webhook URL shown: `https://your-ngrok-url.ngrok.io/api/webhooks/github`
6. Go to GitHub → Repository → Settings → Webhooks
7. Add webhook:
   - **Payload URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/github`
   - **Content type**: application/json
   - **Secret**: (auto-generated, shown in UI)
   - **Events**: Just the push event, Pull requests

**Expected Result**:
- ✅ Webhook record created in `guard_github_repositories`
- ✅ Webhook registered on GitHub

**Verify in Database**:
```sql
SELECT
    full_name,
    auto_scan_enabled,
    pr_scan_enabled,
    webhook_id,
    webhook_secret IS NOT NULL as has_secret,
    autoscan_branches
FROM guard_github_repositories
WHERE user_id = (SELECT id FROM "user" WHERE email = 'your-email@example.com');
```

### 6.2 Test Push Event

**Steps**:
1. Make a commit to the repository
2. Push to GitHub
3. Wait for webhook delivery
4. Check app for new scan

**Expected Result**:
- ✅ Webhook received at `/api/webhooks/github`
- ✅ Signature verified successfully
- ✅ New scan created automatically
- ✅ Scan processed in background

**Verify Webhook Delivery**:
```bash
# Check dev server logs
# Look for:
# - POST /api/webhooks/github 200
# - "Processing push event..."
# - "Scan initiated: scan_xxx"
```

**Verify in Database**:
```sql
SELECT
    id,
    type,
    github_url,
    branch,
    commit_sha,
    triggered_by,
    webhook_delivery_id,
    status,
    created_at
FROM guard_scans
WHERE triggered_by = 'webhook'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 7: Pull Request Comment Bot

### 7.1 Create Pull Request

**Steps**:
1. Create a new branch in your repository
2. Make some changes (add intentional security issue for testing)
3. Push branch and create Pull Request
4. Wait for webhook

**Expected Result**:
- ✅ PR webhook received
- ✅ Code scanned automatically
- ✅ Comment posted on PR with results

**Example PR Comment**:
```markdown
## 🛡️ Klyntos Guard Security Scan

**Status**: ⚠️ Issues Found
**Files Scanned**: 5
**Scan ID**: `scan_abc123`

### Security Issues Found

- 🚨 **Critical**: 0
- ⚠️ **High**: 2
- 🟡 **Medium**: 5
- ℹ️ **Low**: 3

### Top Issues

1. **SQL Injection Risk** (High)
   - File: `api/users.js:45`
   - Unsanitized user input in SQL query

2. **Hardcoded Secret** (High)
   - File: `config/database.js:12`
   - API key found in source code

[View Full Report →](http://localhost:3001/scans/scan_abc123)
```

### 7.2 Update Existing PR Comment

**Steps**:
1. Push another commit to the same PR branch
2. Wait for webhook
3. Check if comment is updated (not duplicated)

**Expected Result**:
- ✅ Existing comment found and updated
- ✅ No duplicate comments created
- ✅ New scan results reflected

---

## Test 8: API Key Generation & CLI Usage

### 8.1 Generate API Key

**URL**: http://localhost:3001/settings

**Steps**:
1. Log in
2. Navigate to Settings
3. Click "Generate API Key"
4. Copy the key (shown only once)

**Expected Result**:
- ✅ API key created in `guard_api_keys` table
- ✅ Key hashed for security
- ✅ Plain key shown to user once

**Verify in Database**:
```sql
SELECT
    name,
    key_hash IS NOT NULL as is_hashed,
    last_used_at,
    created_at,
    expires_at
FROM guard_api_keys
WHERE user_id = (SELECT id FROM "user" WHERE email = 'your-email@example.com')
ORDER BY created_at DESC;
```

### 8.2 Use API Key with CLI

**Install CLI** (when ready):
```bash
npm install -g @klyntos/guard-cli
```

**Configure**:
```bash
kg config set-api-key YOUR_API_KEY
```

**Test Scan**:
```bash
kg scan ./my-project
```

**Expected Result**:
- ✅ API key validated
- ✅ Scan executes successfully
- ✅ `last_used_at` updated in database

---

## Test 9: Subscription & Payment

### 9.1 Stripe Checkout (Basic Plan)

**URL**: http://localhost:3001/pricing

**Steps**:
1. Log in
2. Navigate to /pricing
3. Click "Upgrade to Basic" ($99/month)
4. Complete Stripe checkout (test mode)

**Test Card**:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Expected Result**:
- ✅ Stripe checkout session created
- ✅ After payment, webhook received
- ✅ Subscription created in `guard_subscriptions`
- ✅ User's plan upgraded

**Verify in Database**:
```sql
SELECT
    plan,
    status,
    stripe_subscription_id,
    current_period_start,
    current_period_end
FROM guard_subscriptions
WHERE user_id = (SELECT id FROM "user" WHERE email = 'your-email@example.com')
ORDER BY created_at DESC
LIMIT 1;
```

### 9.2 Verify Increased Limits

**After Subscription Active**:

**Free Plan Limits**:
- 10 scans/month
- 5,000 LLM tokens

**Basic Plan Limits**:
- 100 scans/month
- 50,000 LLM tokens
- Webhook auto-scan
- Priority support

**Test**:
```bash
# Try to scan more than free tier allows
# Should succeed with Basic plan

kg scan ./project-1
kg scan ./project-2
# ... continue beyond free tier limit
kg scan ./project-15
```

**Expected Result**:
- ✅ Scans beyond free tier work
- ✅ Usage tracked in `guard_usage` table

---

## Test 10: IDE Integration Setup

### 10.1 Access IDE Setup Page

**URL**: http://localhost:3001/ide-setup

**Steps**:
1. Log in
2. Navigate to /ide-setup
3. API key auto-populated
4. Click "Copy VS Code Settings"

**Expected Result**:
- ✅ Settings snippet copied to clipboard
- ✅ Instructions shown for VS Code
- ✅ Instructions shown for Cursor
- ✅ CLI alternative also shown

**Settings Snippet Example**:
```json
{
  "klyntos.guard.apiKey": "kg_live_abc123...",
  "klyntos.guard.autoScan": true,
  "klyntos.guard.scanOnSave": true,
  "klyntos.guard.policy": "moderate"
}
```

### 10.2 Install in VS Code (Manual Setup)

**Steps**:
1. Open VS Code
2. Press `Cmd+,` (settings)
3. Click "Open Settings (JSON)" in top right
4. Paste the copied settings
5. Save file

**Expected Result**:
- ✅ Extension recognizes API key
- ✅ Auto-scan on save works
- ✅ Inline diagnostics appear

---

## Test 11: End-to-End Workflow

### Complete User Journey

**Scenario**: New user discovers KlyntosGuard, signs up, scans a project, sets up GitHub webhook, and configures IDE

#### Step 1: Discovery & Signup (2 minutes)
1. Visit http://localhost:3001
2. Click "Sign Up with GitHub"
3. Authorize app
4. Redirected to /guardrails

#### Step 2: First Scan (3 minutes)
1. Select "GitHub URL" scan type
2. Enter: `https://github.com/my-org/my-project`
3. Click "Scan Repository"
4. Wait for results
5. Review 12 vulnerabilities found

#### Step 3: Set Up Auto-Scan (5 minutes)
1. Click "Enable Auto-Scan" on scanned repo
2. Copy webhook URL
3. Add webhook to GitHub repository settings
4. Make a test commit
5. Verify auto-scan triggered

#### Step 4: Create Pull Request with Bot (5 minutes)
1. Create new branch with changes
2. Push and create PR
3. Wait for bot comment
4. Review security feedback directly in PR
5. Fix issues
6. Push fixes
7. See updated bot comment

#### Step 5: IDE Integration (5 minutes)
1. Navigate to /ide-setup
2. Copy settings snippet
3. Add to VS Code settings.json
4. Open project in VS Code
5. See inline security warnings
6. Save file → auto-scan triggers
7. Review results in Problems panel

#### Step 6: Upgrade to Paid Plan (2 minutes)
1. Hit free tier limit (10 scans)
2. See upgrade prompt
3. Click "Upgrade to Basic"
4. Complete Stripe checkout (test mode)
5. Continue scanning without limits

**Total Time**: ~22 minutes from discovery to production usage

**Expected Result**:
- ✅ Seamless onboarding
- ✅ All features work together
- ✅ No manual configuration needed
- ✅ GitHub integration automatic
- ✅ Payment processed successfully

---

## Verification Queries

### Check Recent Activity

```sql
-- Recent users
SELECT
    id,
    name,
    email,
    created_at,
    (SELECT COUNT(*) FROM account WHERE user_id = u.id) as linked_accounts
FROM "user" u
ORDER BY created_at DESC
LIMIT 5;

-- Recent scans
SELECT
    s.id,
    s.type,
    s.github_url,
    s.status,
    s.triggered_by,
    u.email as user_email,
    s.created_at
FROM guard_scans s
JOIN "user" u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 10;

-- Active subscriptions
SELECT
    u.email,
    gs.plan,
    gs.status,
    gs.current_period_end
FROM guard_subscriptions gs
JOIN "user" u ON gs.user_id = u.id
WHERE gs.status = 'active'
ORDER BY gs.created_at DESC;

-- API key usage
SELECT
    gak.name,
    u.email,
    gak.last_used_at,
    gak.created_at
FROM guard_api_keys gak
JOIN "user" u ON gak.user_id = u.id
WHERE gak.last_used_at IS NOT NULL
ORDER BY gak.last_used_at DESC
LIMIT 10;

-- Webhook configurations
SELECT
    u.email,
    ggr.full_name,
    ggr.auto_scan_enabled,
    ggr.pr_scan_enabled,
    ggr.autoscan_branches,
    ggr.created_at
FROM guard_github_repositories ggr
JOIN "user" u ON ggr.user_id = u.id
ORDER BY ggr.created_at DESC;
```

---

## Common Issues & Troubleshooting

### Issue 1: OAuth Redirect Error

**Symptom**: "Callback URL mismatch" error when signing in with GitHub/Google

**Cause**: OAuth app callback URL doesn't match `BETTER_AUTH_URL`

**Fix**:
```bash
# Check .env.local
cat .env.local | grep BETTER_AUTH_URL

# Update GitHub OAuth app settings:
# http://localhost:3001/api/auth/callback/github

# Update Google OAuth app settings:
# http://localhost:3001/api/auth/callback/google
```

### Issue 2: Webhook Signature Verification Failed

**Symptom**: Webhook returns 401 Unauthorized

**Cause**: Webhook secret mismatch

**Fix**:
```sql
-- Get the correct secret from database
SELECT webhook_secret
FROM guard_github_repositories
WHERE full_name = 'your-org/your-repo';

-- Update GitHub webhook secret to match
```

### Issue 3: Scan Stays in "Pending" Status

**Symptom**: Scan never completes, stuck in "pending"

**Cause**: Background job failed or API not reachable

**Fix**:
```bash
# Check dev server logs for errors
tail -f .next/dev.log

# Check if Python API is running
curl http://localhost:8000/health

# Restart Python API if needed
cd ../api
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Issue 4: No Repositories Shown in Dropdown

**Symptom**: "My Repositories" scan type shows empty list

**Cause**: GitHub access token expired or missing `repo` scope

**Fix**:
1. Sign out
2. Sign in with GitHub again
3. Re-authorize with `repo` scope
4. Check database:
```sql
SELECT scope, expires_at
FROM account
WHERE provider = 'github'
AND user_id = 'YOUR_USER_ID';
```

---

## Next Steps After Testing

### If All Tests Pass ✅

1. **Deploy to Staging**
   ```bash
   vercel --prod
   ```

2. **Update OAuth Redirect URLs**
   - GitHub: https://guard.klyntos.com/api/auth/callback/github
   - Google: https://guard.klyntos.com/api/auth/callback/google

3. **Enable Stripe Live Mode**
   - Replace test API keys with live keys
   - Test real payment flow

4. **Set Up Monitoring**
   - Sentry for error tracking
   - LogTail for log aggregation
   - Uptime monitoring

### If Tests Fail ❌

1. **Document the failure**
   - Which test failed?
   - What was the error message?
   - What did you expect vs. what happened?

2. **Check relevant logs**
   - Next.js dev server output
   - Database query results
   - Network requests in browser DevTools

3. **Create GitHub issue**
   - Include steps to reproduce
   - Attach screenshots/logs
   - Tag as `bug` and `testing`

---

## Testing Checklist

Use this checklist to track your testing progress:

### Authentication
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Sign out works
- [ ] GitHub OAuth signup works
- [ ] GitHub OAuth login works
- [ ] Google OAuth signup works
- [ ] Google OAuth login works
- [ ] Account linking works (same email, different providers)

### Scanning
- [ ] GitHub URL scan works
- [ ] My repositories scan works (GitHub OAuth)
- [ ] Scan results display correctly
- [ ] Vulnerabilities saved to database
- [ ] Scan history shows in dashboard

### GitHub Integration
- [ ] Webhook setup works
- [ ] Push event triggers auto-scan
- [ ] PR event triggers scan
- [ ] Bot comment posted on PR
- [ ] Bot comment updated (not duplicated) on new push
- [ ] Signature verification works

### Payments
- [ ] Stripe checkout works (test mode)
- [ ] Webhook creates subscription
- [ ] User plan upgraded
- [ ] Increased limits applied
- [ ] Subscription status tracked

### API & CLI
- [ ] API key generation works
- [ ] API key visible once
- [ ] CLI authentication works
- [ ] CLI scan works
- [ ] API key usage tracked

### IDE Integration
- [ ] IDE setup page loads
- [ ] Settings snippet copies correctly
- [ ] Instructions are clear
- [ ] API key auto-populated

### End-to-End
- [ ] Complete user journey (signup → scan → webhook → IDE) works
- [ ] No broken links
- [ ] All pages load correctly
- [ ] No console errors

---

## Testing Status

**Last Updated**: November 2, 2025
**Tested By**: _[Your Name]_
**Test Environment**: Local Development (http://localhost:3001)

**Overall Status**: 🟡 Ready for Testing

**Notes**:
- Database migrations applied successfully
- All OAuth providers configured
- Dev server running stable
- Ready for comprehensive E2E testing

---

**Need Help?**
- Check dev server logs: `npm run dev` output
- Check database: Use SQL queries above
- Check docs: [GITHUB_INTEGRATION_COMPLETE.md](./GITHUB_INTEGRATION_COMPLETE.md)
- Open an issue: [GitHub Issues](https://github.com/klyntos/KlyntosGuard/issues)
