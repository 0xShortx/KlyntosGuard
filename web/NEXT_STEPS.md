# Next Steps for KlyntosGuard Backend Implementation

## Current Status

### ✅ Completed
1. **CLI Implementation** - Complete and tested
   - All commands working (scan, auth, config, report)
   - Beautiful terminal UI with Rich library
   - Secure API key storage
   - Ready for backend integration

2. **Database Schema Created**
   - `guard_scans` table exists (UUID-based)
   - `guard_vulnerabilities` table created
   - `guard_api_keys` table exists but needs schema update
   - Better Auth tables configured

3. **API Endpoints** (Partially Complete)
   - `/api/cli/generate-key` - Exists but uses mock auth
   - `/api/cli/keys` - Exists but uses mock auth
   - `/api/v1/scan` - Exists
   - Need to add: scan history, user info, etc.

### ⚠️ Schema Mismatch Issue

**Problem**: Type incompatibility between tables
- `user` table uses `TEXT` for IDs (Better Auth standard)
- `guard_api_keys` uses `UUID` for user_id
- `guard_scans` uses `UUID` for user_id

**Solution Required**: Migrate guard_api_keys and guard_scans to use TEXT for user_id to match Better Auth

## Immediate Tasks

### 1. Fix Schema Type Mismatch

Create migration to update guard_api_keys:

```sql
-- Backup existing data
CREATE TABLE guard_api_keys_backup AS SELECT * FROM guard_api_keys;

-- Drop and recreate with TEXT
DROP TABLE IF EXISTS guard_api_keys CASCADE;

CREATE TABLE guard_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_guard_api_keys_user_id ON guard_api_keys(user_id);
CREATE INDEX idx_guard_api_keys_key ON guard_api_keys(key);
```

Update guard_scans similarly.

### 2. Enable Better Auth in API Endpoints

Update these files to use real authentication:

**`/api/cli/generate-key/route.ts`**:
```typescript
// Uncomment these lines:
const session = await auth.api.getSession({ headers: request.headers })
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = session.user.id

// Remove mock user ID
```

**`/api/cli/keys/route.ts`**:
- Same changes

### 3. Create New API Endpoints

#### A. User Info Endpoint (for `kg auth whoami`)

**`/api/v1/user/me/route.ts`**:
```typescript
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user info with scan count
  const [scansThisMonth] = await db
    .select({ count: sql<number>`count(*)` })
    .from(guardScans)
    .where(
      and(
        eq(guardScans.userId, session.user.id),
        gte(guardScans.createdAt, startOfMonth(new Date()))
      )
    )

  return NextResponse.json({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    scans_this_month: scansThisMonth?.count || 0,
    created_at: session.user.createdAt,
  })
}
```

#### B. API Key Verification (for CLI auth)

**`/api/v1/auth/verify/route.ts`**:
```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer kg_')) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  const apiKey = authHeader.substring(7) // Remove 'Bearer '
  const hashedKey = createHash('sha256').update(apiKey).digest('hex')

  const [keyRecord] = await db
    .select()
    .from(guardApiKeys)
    .where(
      and(
        eq(guardApiKeys.key, hashedKey),
        eq(guardApiKeys.isActive, true)
      )
    )
    .limit(1)

  if (!keyRecord) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  // Update last used
  await db
    .update(guardApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(guardApiKeys.id, keyRecord.id))

  // Get user info
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, keyRecord.userId))
    .limit(1)

  return NextResponse.json({
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  })
}
```

#### C. Update Scan Endpoint to Save Results

**Modify `/api/v1/scan/route.ts`**:

After getting scan results from Claude, save to database:

```typescript
// After successful scan
const scanId = crypto.randomUUID()

const [savedScan] = await db.insert(guardScans).values({
  id: scanId,
  userId: session.user.id,
  fileName: filename,
  fileSize: code.length,
  issuesFound: violations.length,
  severity: violations.length > 0 ? getHighestSeverity(violations) : 'low',
  scanDurationMs: scanDuration,
  apiKeyUsed: apiKeyId, // If using API key
  createdAt: new Date(),
}).returning()

// Save vulnerabilities
if (violations.length > 0) {
  await db.insert(guardVulnerabilities).values(
    violations.map(v => ({
      id: crypto.randomUUID(),
      scanId: scanId,
      severity: v.severity,
      category: v.category,
      message: v.message,
      line: v.line,
      column: v.column,
      codeSnippet: v.code_snippet,
      suggestion: v.suggestion,
      cwe: v.cwe,
      createdAt: new Date(),
    }))
  )
}
```

#### D. Scan History Endpoints

**`/api/v1/scans/route.ts`**:
```typescript
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = parseInt(searchParams.get('offset') || '0')

  const scans = await db
    .select()
    .from(guardScans)
    .where(eq(guardScans.userId, session.user.id))
    .orderBy(desc(guardScans.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({ scans, limit, offset })
}
```

**`/api/v1/scans/[id]/route.ts`**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers })

  const [scan] = await db
    .select()
    .from(guardScans)
    .where(
      and(
        eq(guardScans.id, params.id),
        eq(guardScans.userId, session.user.id)
      )
    )
    .limit(1)

  if (!scan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Get vulnerabilities
  const vulnerabilities = await db
    .select()
    .from(guardVulnerabilities)
    .where(eq(guardVulnerabilities.scanId, params.id))

  return NextResponse.json({ ...scan, vulnerabilities })
}
```

### 4. Create Dashboard UI

#### A. API Keys Settings Page

**`/settings/api-keys/page.tsx`**:

Features:
- List all API keys with prefix
- Create new key button
- Modal to show full key (only once)
- Revoke key button
- Last used timestamp

#### B. Scan History Dashboard

**`/scans/page.tsx`**:

Features:
- Table of all scans
- Filter by status/date
- View details button
- Export button

**`/scans/[id]/page.tsx`**:

Features:
- Scan metadata
- List of vulnerabilities with:
  - Severity badges
  - Code snippets
  - Fix suggestions
  - CWE references

### 5. Testing Workflow

Once all endpoints are implemented:

1. **Sign up/Login** via web interface
2. **Navigate to Settings** → API Keys
3. **Create API Key**
4. **Copy key** to clipboard
5. **Test CLI**:
   ```bash
   kg auth login --api-key kg_xxxxx
   kg auth whoami
   kg scan test_vulnerable.py
   kg report list
   ```

### 6. Update Schema File

Update `/lib/db/schema.ts` to match actual database:

```typescript
export const guardApiKeys = pgTable('guard_api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  key: text('key').notNull().unique(),
  prefix: text('prefix').notNull(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
})
```

## Priority Order

1. **HIGH**: Fix schema type mismatch (guard_api_keys, guard_scans to TEXT)
2. **HIGH**: Enable Better Auth in existing endpoints
3. **HIGH**: Create `/api/v1/auth/verify` endpoint
4. **HIGH**: Update scan endpoint to save results
5. **MEDIUM**: Create scan history endpoints
6. **MEDIUM**: Create `/api/v1/user/me` endpoint
7. **MEDIUM**: Build API Keys settings page
8. **LOW**: Build scan history dashboard
9. **LOW**: Add export functionality

## Files to Create/Modify

### Create:
- `migrations/004_fix_type_mismatch.sql`
- `src/app/api/v1/auth/verify/route.ts`
- `src/app/api/v1/user/me/route.ts`
- `src/app/api/v1/scans/route.ts`
- `src/app/api/v1/scans/[id]/route.ts`
- `src/app/settings/api-keys/page.tsx`
- `src/app/scans/page.tsx`
- `src/app/scans/[id]/page.tsx`

### Modify:
- `src/app/api/cli/generate-key/route.ts` - Enable auth
- `src/app/api/cli/keys/route.ts` - Enable auth
- `src/app/api/v1/scan/route.ts` - Save to database
- `src/lib/db/schema.ts` - Fix types

## Summary

The CLI is complete and ready. The database schema needs a type fix, then we need to:
1. Enable authentication in existing endpoints
2. Create new endpoints for CLI support
3. Build dashboard UI for API key and scan management
4. Test end-to-end workflow

After these steps, users will be able to use the full `kg` CLI tool to scan their code!
