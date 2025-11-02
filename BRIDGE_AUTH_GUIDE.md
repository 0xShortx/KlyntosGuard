# Bridge Authentication Guide
## Better Auth (Web) ↔️ JWT (CLI)

This guide explains how to bridge the web authentication (Better Auth) with the CLI authentication (JWT) so users have **one account** accessible from both interfaces.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Single User Account (Better Auth)             │
│                   user@example.com                           │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
  ┌──────────────┐                    ┌───────────────┐
  │   Web UI     │                    │   CLI Tool    │
  │ (Next.js)    │                    │  (Python kg)  │
  │              │                    │               │
  │ Better Auth  │                    │  JWT Auth     │
  │ Session      │                    │  API Key      │
  └──────────────┘                    └───────────────┘
         │                                     │
         │    Generate API Key                 │
         │──────────────────────────────────►  │
         │                                     │
         │                                     │
         │    Exchange API Key for JWT         │
         │  ◄──────────────────────────────────│
         │                                     │
         └──────────────┬──────────────────────┘
                        ▼
              ┌──────────────────┐
              │ Shared Database  │
              │  (PostgreSQL)    │
              │                  │
              │ • Users          │
              │ • API Keys       │
              │ • Subscriptions  │
              └──────────────────┘
```

---

## Database Schema

### 1. Add API Keys Table

This table stores CLI API keys linked to Better Auth users:

```sql
-- Add to your schema (Drizzle)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- The actual API key (hashed)
  key_hash VARCHAR(255) NOT NULL,

  -- Readable prefix for identification (e.g., "kg_1234...")
  key_prefix VARCHAR(20) NOT NULL,

  -- User-provided name
  name VARCHAR(100) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  -- IP restriction (optional)
  allowed_ips TEXT[],

  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 1000
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
```

### 2. Drizzle Schema (TypeScript)

```typescript
// packages/db/schema/api-keys.ts
import { pgTable, uuid, varchar, timestamp, boolean, integer, text } from 'drizzle-orm/pg-core'
import { users } from './users'

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),

  isActive: boolean('is_active').default(true),

  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),

  allowedIps: text('allowed_ips').array(),
  rateLimitPerHour: integer('rate_limit_per_hour').default(1000),
})
```

---

## Implementation Steps

### Step 1: API Key Generation (Web UI)

Create an API route in the Next.js app to generate CLI API keys:

```typescript
// apps/guard/app/api/cli/generate-key/route.ts
import { auth } from '@/lib/auth'
import { db } from '@klyntos/db'
import { apiKeys } from '@klyntos/db/schema'
import { hash } from 'bcrypt'
import crypto from 'crypto'

export async function POST(request: Request) {
  // 1. Verify user is logged in (Better Auth)
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, expiresInDays } = await request.json()

  // 2. Generate API key
  const apiKey = `kg_${crypto.randomBytes(32).toString('hex')}`
  const keyPrefix = apiKey.substring(0, 12) // "kg_1234567..."
  const keyHash = await hash(apiKey, 10)

  // 3. Calculate expiration
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  // 4. Save to database
  const [newKey] = await db.insert(apiKeys).values({
    userId: session.user.id,
    keyHash,
    keyPrefix,
    name: name || 'CLI Access',
    expiresAt,
  }).returning()

  // 5. Return the plain API key (ONLY TIME IT'S SHOWN)
  return Response.json({
    apiKey, // Plain text - user must save this!
    keyId: newKey.id,
    keyPrefix: newKey.keyPrefix,
    expiresAt: newKey.expiresAt,
    message: 'Save this API key - it will not be shown again!',
  })
}
```

### Step 2: API Key Verification Endpoint

Create an endpoint that the Python CLI can use to exchange an API key for a JWT token:

```typescript
// apps/guard/app/api/cli/verify-key/route.ts
import { db } from '@klyntos/db'
import { apiKeys, users } from '@klyntos/db/schema'
import { eq, and } from 'drizzle-orm'
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  const { apiKey } = await request.json()

  if (!apiKey || !apiKey.startsWith('kg_')) {
    return Response.json({ error: 'Invalid API key format' }, { status: 400 })
  }

  // 1. Extract key prefix for faster lookup
  const keyPrefix = apiKey.substring(0, 12)

  // 2. Find all keys with this prefix (there should be only one)
  const potentialKeys = await db.query.apiKeys.findMany({
    where: and(
      eq(apiKeys.keyPrefix, keyPrefix),
      eq(apiKeys.isActive, true)
    ),
    with: {
      user: true,
    },
  })

  // 3. Check each key's hash (bcrypt compare)
  let matchedKey = null
  for (const key of potentialKeys) {
    const isValid = await compare(apiKey, key.keyHash)
    if (isValid) {
      matchedKey = key
      break
    }
  }

  if (!matchedKey) {
    return Response.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // 4. Check if expired
  if (matchedKey.expiresAt && new Date() > matchedKey.expiresAt) {
    return Response.json({ error: 'API key expired' }, { status: 401 })
  }

  // 5. Update last used timestamp
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, matchedKey.id))

  // 6. Generate JWT token for CLI
  const jwtToken = jwt.sign(
    {
      user_id: matchedKey.user.id,
      email: matchedKey.user.email,
      api_key_id: matchedKey.id,
    },
    process.env.JWT_SECRET_KEY!,
    { expiresIn: '7d' } // JWT expires in 7 days
  )

  // 7. Return JWT token
  return Response.json({
    access_token: jwtToken,
    token_type: 'bearer',
    expires_in: 604800, // 7 days in seconds
    user: {
      id: matchedKey.user.id,
      email: matchedKey.user.email,
    },
  })
}
```

### Step 3: List & Revoke API Keys

```typescript
// apps/guard/app/api/cli/keys/route.ts

// GET - List user's API keys
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, session.user.id),
    columns: {
      id: true,
      keyPrefix: true,
      name: true,
      isActive: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
    },
  })

  return Response.json({ keys })
}

// DELETE - Revoke an API key
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keyId } = await request.json()

  await db.update(apiKeys)
    .set({ isActive: false })
    .where(and(
      eq(apiKeys.id, keyId),
      eq(apiKeys.userId, session.user.id)
    ))

  return Response.json({ success: true })
}
```

---

## CLI Integration

### Update Python CLI to Support API Keys

```python
# src/klyntos_guard/cli/enhanced_cli.py

@auth.command(name="login")
@click.option("--email", help="Your email address")
@click.option("--password", help="Your password")
@click.option("--api-key", help="CLI API key from guard.klyntos.com")
def auth_login(email, password, api_key):
    """Login to KlyntosGuard"""

    if api_key:
        # Login with API key (new flow)
        login_with_api_key(api_key)
    elif email and password:
        # Login with email/password (existing flow)
        login_with_credentials(email, password)
    else:
        # Interactive prompts
        has_api_key = Confirm.ask("Do you have an API key?")

        if has_api_key:
            api_key = Prompt.ask("Enter your API key", password=True)
            login_with_api_key(api_key)
        else:
            email = Prompt.ask("Email")
            password = Prompt.ask("Password", password=True)
            login_with_credentials(email, password)


def login_with_api_key(api_key: str):
    """Login using API key from web UI."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Verifying API key...", total=None)

        try:
            # Exchange API key for JWT token
            api_url = get_api_base_url()

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{api_url}/cli/verify-key",
                    json={"api_key": api_key}
                )

                if response.status_code == 200:
                    data = response.json()
                    token = data["access_token"]
                    user_id = data["user"]["id"]
                    email = data["user"]["email"]

                    save_auth(token, email, user_id)

                    progress.stop()
                    console.print(f"\n[green]✓[/green] Successfully logged in as [cyan]{email}[/cyan]")
                    console.print(f"[dim]Token saved to {AUTH_FILE}[/dim]\n")
                else:
                    progress.stop()
                    error_msg = response.json().get("error", "Unknown error")
                    console.print(f"\n[red]✗[/red] Login failed: {error_msg}\n")

                    if "expired" in error_msg.lower():
                        console.print("[yellow]Your API key has expired. Generate a new one at:[/yellow]")
                        console.print("https://guard.klyntos.com/settings/api-keys\n")

                    raise click.Abort()

        except httpx.ConnectError:
            progress.stop()
            console.print(f"\n[red]✗[/red] Cannot connect to API at {api_url}")
            console.print("[dim]Make sure you're connected to the internet[/dim]\n")
            raise click.Abort()
        except Exception as e:
            progress.stop()
            console.print(f"\n[red]✗[/red] Login failed: {str(e)}\n")
            raise click.Abort()
```

---

## Web UI for API Key Management

### Settings Page Component

```typescript
// apps/guard/app/settings/api-keys/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface ApiKey {
  id: string
  keyPrefix: string
  name: string
  isActive: boolean
  createdAt: string
  expiresAt: string | null
  lastUsedAt: string | null
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    const response = await fetch('/api/cli/keys')
    const data = await response.json()
    setKeys(data.keys)
  }

  const generateKey = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/cli/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName || 'CLI Access',
          expiresInDays: 90, // 90 days
        }),
      })

      const data = await response.json()
      setGeneratedKey(data.apiKey)
      setNewKeyName('')
      fetchKeys()
    } finally {
      setIsGenerating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    await fetch('/api/cli/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId }),
    })
    fetchKeys()
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">CLI API Keys</h1>

      {/* Generate New Key */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate New API Key</h2>

        <div className="flex gap-4">
          <Input
            placeholder="Key name (e.g., 'My Laptop')"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <Button onClick={generateKey} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Key'}
          </Button>
        </div>

        {generatedKey && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠️ Save this key - it won't be shown again!
            </p>
            <code className="block p-2 bg-white rounded font-mono text-sm break-all">
              {generatedKey}
            </code>
            <p className="text-sm text-gray-600 mt-2">
              Use this command to login:
            </p>
            <code className="block p-2 bg-gray-100 rounded text-sm mt-1">
              kg auth login --api-key {generatedKey}
            </code>
          </div>
        )}
      </Card>

      {/* Existing Keys */}
      <h2 className="text-xl font-semibold mb-4">Your API Keys</h2>

      <div className="space-y-4">
        {keys.map((key) => (
          <Card key={key.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm">{key.keyPrefix}...</code>
                  <span className="text-sm font-medium">{key.name}</span>
                  {!key.isActive && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                      Revoked
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt && (
                    <> · Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                  )}
                  {key.expiresAt && (
                    <> · Expires {new Date(key.expiresAt).toLocaleDateString()}</>
                  )}
                </div>
              </div>

              {key.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeKey(key.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          </Card>
        ))}

        {keys.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No API keys yet. Generate one to use the CLI.
          </p>
        )}
      </div>
    </div>
  )
}
```

---

## User Flow

### 1. User Signs Up (Web)

```
1. User goes to guard.klyntos.com
2. Clicks "Sign Up"
3. Creates account with Better Auth
4. Logged in automatically
```

### 2. User Generates API Key (Web)

```
1. User goes to Settings → API Keys
2. Enters key name "My Laptop"
3. Clicks "Generate Key"
4. Sees: kg_a1b2c3d4e5f6...
5. Copies the key
```

### 3. User Logs In (CLI)

```
1. User runs: kg auth login --api-key kg_a1b2c3d4e5f6...
2. CLI sends API key to guard.klyntos.com/api/cli/verify-key
3. Server verifies key, returns JWT token
4. CLI saves JWT to ~/.klyntos_guard/auth.json
5. User is now authenticated!
```

### 4. User Uses CLI

```
1. kg chat "Test message"
2. CLI reads JWT from ~/.klyntos_guard/auth.json
3. Sends request with Authorization: Bearer <jwt>
4. API validates JWT
5. Returns result
```

---

## Security Considerations

### API Key Security

✅ **DO:**
- Hash API keys with bcrypt before storing
- Only show plain key once during generation
- Support key expiration (e.g., 90 days)
- Allow users to revoke keys anytime
- Rate limit key verification attempts
- Log key usage (last_used_at)

❌ **DON'T:**
- Store plain text keys
- Allow unlimited key generation
- Skip expiration dates
- Keep revoked keys active

### JWT Token Security

✅ **DO:**
- Set reasonable expiration (7 days)
- Include api_key_id in JWT payload
- Validate JWT on every request
- Use strong JWT_SECRET_KEY

❌ **DON'T:**
- Make JWTs permanent
- Reuse JWT secrets across environments
- Skip signature verification

---

## Testing the Bridge

### Test 1: Generate Key on Web

```bash
# 1. Open browser
open https://guard.klyntos.com/settings/api-keys

# 2. Click "Generate Key"
# 3. Copy the key: kg_abc123...
```

### Test 2: Login with Key (CLI)

```bash
# Login with API key
kg auth login --api-key kg_abc123...

# Expected output:
# ✓ Successfully logged in as user@example.com
# Token saved to ~/.klyntos_guard/auth.json
```

### Test 3: Verify Same User

```bash
# CLI command
kg usage

# Should show same subscription as web UI
```

### Test 4: Revoke Key

```bash
# 1. Revoke key in web UI
# 2. Try to login again with same key (should fail)
kg auth login --api-key kg_abc123...

# Expected output:
# ✗ Login failed: Invalid API key
```

---

## Summary

✅ **What You Get:**
- Single user account across web and CLI
- Secure API key generation from web UI
- JWT tokens for CLI authentication
- Users can manage multiple API keys
- Keys can be revoked anytime
- Shared database and subscriptions

✅ **User Experience:**
1. Sign up on web → generates account
2. Generate API key in settings
3. Use API key to login in CLI
4. Both web and CLI access same account

✅ **Security:**
- API keys hashed with bcrypt
- JWT tokens expire in 7 days
- Keys can expire and be revoked
- Rate limiting supported

---

## Next Steps

1. ✅ Add `api_keys` table to database schema
2. ✅ Create API key generation endpoint
3. ✅ Create API key verification endpoint
4. ✅ Update CLI to support `--api-key` login
5. ✅ Build web UI for API key management
6. Test the full flow end-to-end

---

**Questions?** This bridges Better Auth (web) with JWT (CLI) perfectly!
