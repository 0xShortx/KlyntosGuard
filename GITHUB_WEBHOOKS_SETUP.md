# GitHub Webhooks Setup Guide

This guide explains how to set up GitHub webhooks for auto-scan on push and PR comment bot functionality in Klyntos Guard.

## Features

1. **Auto-Scan on Push** - Automatically scan repositories when code is pushed
2. **PR Comment Bot** - Post security scan results as comments on pull requests
3. **Webhook Signature Verification** - Secure webhook endpoint with signature validation

## Architecture

```
GitHub Repository
    ↓
Push / PR Event
    ↓
GitHub Webhook (HTTPS)
    ↓
/api/webhooks/github (Next.js API Route)
    ↓
Database (Check if repo has auto-scan enabled)
    ↓
Background Processing (Clone → Scan → Store Results)
    ↓
[For PRs] Post Comment with Results
```

## Prerequisites

1. PostgreSQL database with migrations applied
2. GitHub OAuth app configured
3. HTTPS endpoint (ngrok for local testing, Vercel/Netlify for production)
4. Environment variables configured

## Environment Variables

Add to your `.env.local`:

```bash
# Required for webhook verification
GITHUB_WEBHOOK_SECRET=your-webhook-secret-here

# Required for OAuth (should already be set)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Required for scanning
ANTHROPIC_API_KEY=sk-ant-...
```

## Database Setup

Run the migration to create the necessary tables:

```bash
psql -U your_username -d your_database -f migrations/005_add_github_integration.sql
```

This creates:
- `guard_github_repositories` - Stores repository configuration
- Updates `guard_scans` - Adds GitHub-specific fields

## Local Testing Setup

### 1. Install ngrok

```bash
brew install ngrok
# or
npm install -g ngrok
```

### 2. Start your development server

```bash
npm run dev
# Server running on http://localhost:3001
```

### 3. Start ngrok tunnel

```bash
ngrok http 3001
```

You'll get a public URL like: `https://abc123.ngrok.io`

### 4. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Fill in the details:
   - **Payload URL**: `https://abc123.ngrok.io/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Use the same value as `GITHUB_WEBHOOK_SECRET`
   - **Which events**: Select:
     - ✅ Pushes
     - ✅ Pull requests
   - **Active**: ✅ Checked

4. Click **Add webhook**

### 5. Test the webhook

GitHub will send a `ping` event immediately. Check:

1. Recent Deliveries in GitHub webhook settings
2. Server logs for "Received GitHub webhook: ping"

## Production Setup

### Vercel Deployment

1. Deploy your Next.js app to Vercel
2. Get your production URL (e.g., `https://guard.klyntos.com`)
3. Add environment variables in Vercel dashboard:
   - `GITHUB_WEBHOOK_SECRET`
   - Other required env vars

4. Configure GitHub webhook with production URL:
   - Payload URL: `https://guard.klyntos.com/api/webhooks/github`

## Enabling Auto-Scan for a Repository

Users must enable auto-scan for their repositories through the UI (or database):

### Option 1: Via UI (Recommended - TODO)

Create a settings page where users can:
1. Connect their GitHub account
2. Select repositories to monitor
3. Enable auto-scan and PR scanning
4. Configure which branches to scan

### Option 2: Via Database (For Testing)

```sql
-- Insert repository configuration
INSERT INTO guard_github_repositories (
    id,
    user_id,
    full_name,
    default_branch,
    auto_scan_enabled,
    autoscan_branches,
    pr_scan_enabled,
    policy
) VALUES (
    'repo_' || gen_random_uuid()::text,
    'user123', -- User's ID from Better Auth
    'username/repo-name',
    'main',
    true,
    ARRAY['main', 'develop'], -- Branches to auto-scan
    true, -- Enable PR scanning
    'moderate' -- Security policy
);
```

## Webhook Events Handled

### 1. Push Events

**Trigger**: When code is pushed to a branch
**Behavior**:
- Checks if repository has auto-scan enabled
- Checks if pushed branch is in the auto-scan list
- Creates a scan record in the database
- Clones repository and scans in background
- Updates scan record with results

**Response**:
```json
{
  "message": "Scan triggered successfully",
  "deliveryId": "abc123-...",
  "scanId": "scan_xyz789",
  "repository": "username/repo",
  "branch": "main",
  "commitSha": "a1b2c3d..."
}
```

### 2. Pull Request Events

**Trigger**: When a PR is opened, synchronized, or reopened
**Behavior**:
- Same as push events, plus:
- Posts scan results as a comment on the PR
- Updates comment if scan is re-run (on new commits)

**PR Comment Format**:
```markdown
## 🚨 Klyntos Guard Security Scan

**Status**: ❌ Failed
**Files Scanned**: 42
**Scan Time**: 3.2s

### Security Issues Found

- 🚨 **Critical**: 2
- ⚠️ **High**: 5
- ⚡ **Medium**: 8
- ℹ️ **Low**: 3

### Top Issues

1. **CRITICAL**: SQL Injection
   - **File**: `src/database/queries.ts:45`
   - **Description**: User input directly interpolated into SQL query
   - **Fix**: Use parameterized queries

...

---
🛡️ Scan ID: `scan_xyz789` | Powered by [Klyntos Guard](https://guard.klyntos.com)
```

### 3. Ping Events

**Trigger**: When webhook is first created or tested
**Behavior**: Returns success response

**Response**:
```json
{
  "message": "Pong! Webhook configured successfully",
  "deliveryId": "abc123-..."
}
```

## Security

### Webhook Signature Verification

All webhook payloads are verified using HMAC SHA-256:

1. GitHub signs the payload with your `GITHUB_WEBHOOK_SECRET`
2. Sends signature in `X-Hub-Signature-256` header
3. Our endpoint verifies the signature before processing
4. Invalid signatures are rejected with 401 Unauthorized

**Implementation** (in `route.ts`):
```typescript
function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const sig = Buffer.from(signature.replace('sha256=', ''), 'hex')
  const hmac = createHmac('sha256', secret)
  const digest = Buffer.from(hmac.update(payload).digest('hex'), 'hex')

  return timingSafeEqual(sig, digest)
}
```

## Troubleshooting

### Webhook not receiving events

1. **Check ngrok is running** (for local dev)
   ```bash
   curl https://your-ngrok-url.ngrok.io/api/webhooks/github
   # Should return 405 Method Not Allowed (POST required)
   ```

2. **Check GitHub webhook deliveries**
   - Go to repository → Settings → Webhooks
   - Click on your webhook
   - Check "Recent Deliveries" tab
   - Look for failed deliveries and response codes

3. **Check server logs**
   ```bash
   # Should see these log messages:
   Received GitHub webhook: push (delivery-id-here)
   Push event: username/repo:main (commit-sha)
   ```

### Webhook signature verification failing

1. **Ensure `GITHUB_WEBHOOK_SECRET` matches**
   - Same value in `.env.local` and GitHub webhook settings

2. **Check raw body is being read**
   - Next.js must read raw request body for signature verification
   - Our implementation uses `request.text()` before parsing

### Scans not triggering

1. **Check repository is configured**
   ```sql
   SELECT * FROM guard_github_repositories
   WHERE full_name = 'username/repo';
   ```

2. **Check auto_scan_enabled is true**

3. **Check branch is in autoscan_branches array**
   ```sql
   SELECT autoscan_branches FROM guard_github_repositories
   WHERE full_name = 'username/repo';
   ```

4. **Check user has GitHub access token**
   ```sql
   SELECT access_token FROM account
   WHERE user_id = 'user-id' AND provider_id = 'github';
   ```

### PR comments not posting

1. **Check pr_scan_enabled is true**

2. **Check GitHub token has correct scopes**
   - Requires: `repo` scope (for private repos)
   - Or: `public_repo` scope (for public repos only)

3. **Check Octokit errors in logs**
   ```
   Error posting PR comment: ...
   ```

## Testing Workflow

### End-to-End Test

1. **Enable auto-scan** for a test repository

2. **Make a test commit**:
   ```bash
   echo "// test" >> test.ts
   git add test.ts
   git commit -m "Test webhook"
   git push
   ```

3. **Check webhook delivery** in GitHub

4. **Check scan record** in database:
   ```sql
   SELECT * FROM guard_scans
   ORDER BY created_at DESC
   LIMIT 1;
   ```

5. **Check scan results**:
   ```sql
   SELECT status, results, error
   FROM guard_scans
   WHERE id = 'scan-id-from-above';
   ```

### PR Comment Test

1. **Create a PR** with security issues:
   ```typescript
   // bad-code.ts
   const query = `SELECT * FROM users WHERE id = ${userId}` // SQL injection
   ```

2. **Check PR for comment** from your account

3. **Push new commit** to same PR

4. **Verify comment is updated** (not duplicated)

## API Endpoints

### POST /api/webhooks/github

Receives GitHub webhook events.

**Headers**:
- `X-Hub-Signature-256`: GitHub webhook signature
- `X-GitHub-Event`: Event type (push, pull_request, ping)
- `X-GitHub-Delivery`: Unique delivery ID

**Events Handled**:
- `ping` - Webhook test
- `push` - Code pushed to repository
- `pull_request` - PR opened/updated/reopened

**Responses**:
- `200 OK` - Event processed successfully
- `401 Unauthorized` - Invalid signature
- `500 Internal Server Error` - Processing error

## Database Schema

### guard_github_repositories

```sql
CREATE TABLE guard_github_repositories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    full_name TEXT NOT NULL, -- "owner/repo"
    default_branch TEXT NOT NULL DEFAULT 'main',
    auto_scan_enabled BOOLEAN DEFAULT false,
    autoscan_branches TEXT[], -- ['main', 'develop']
    pr_scan_enabled BOOLEAN DEFAULT false,
    policy TEXT DEFAULT 'moderate',
    webhook_id TEXT, -- GitHub webhook ID
    webhook_secret TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### guard_scans (updated)

```sql
ALTER TABLE guard_scans
  ADD COLUMN type TEXT NOT NULL, -- 'github' | 'local' | 'upload'
  ADD COLUMN github_url TEXT,
  ADD COLUMN branch TEXT,
  ADD COLUMN commit_sha TEXT,
  ADD COLUMN pr_number INTEGER,
  ADD COLUMN triggered_by TEXT, -- 'webhook' | 'pr' | 'manual'
  ADD COLUMN webhook_delivery_id TEXT,
  ADD COLUMN results TEXT, -- JSON
  ADD COLUMN error TEXT,
  ADD COLUMN completed_at TIMESTAMP;
```

## Next Steps

1. **Create UI for repository management**
   - List user's repositories
   - Enable/disable auto-scan
   - Configure branches and policy
   - View scan history

2. **Add webhook management**
   - Automatically create/update webhooks via GitHub API
   - Delete webhooks when disabled
   - Show webhook status (active/inactive)

3. **Enhanced PR comments**
   - Inline comments on specific lines
   - Diff-aware scanning (only scan changed files)
   - Status checks integration

4. **Rate limiting**
   - Limit scans per repository
   - Queue system for large repos
   - Scan throttling

## Resources

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Validating Webhook Deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Octokit.js](https://octokit.github.io/rest.js/)
