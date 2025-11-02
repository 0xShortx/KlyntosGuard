# Backend API Requirements for CLI Support

## Overview

The KlyntosGuard CLI (`kg` command) is now complete and requires backend API endpoints to function. This document outlines all required endpoints, database schemas, and features.

## Current Status

### ✅ Already Implemented
- `POST /api/v1/scan` - Code scanning endpoint
- User authentication with Better Auth
- Stripe subscription handling
- Basic dashboard

### ❌ Required for CLI

## 1. API Key Management

### Database Schema

```typescript
// schema.ts
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").unique().notNull(), // SHA-256 hash of the key
  keyPrefix: text("key_prefix").notNull(), // First 8 chars: kg_abc12345
  name: text("name").notNull(), // User-friendly name
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at")
});
```

### API Endpoints

#### Create API Key
```typescript
POST /api/v1/api-keys

Headers:
  Authorization: Bearer <session_token>

Request:
{
  "name": "My Development Key"
}

Response:
{
  "id": "uuid",
  "key": "kg_abc12345678901234567890", // Full key shown ONLY ONCE
  "name": "My Development Key",
  "prefix": "kg_abc12345",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### List API Keys
```typescript
GET /api/v1/api-keys

Headers:
  Authorization: Bearer <session_token>

Response:
{
  "keys": [
    {
      "id": "uuid",
      "name": "My Development Key",
      "prefix": "kg_abc12345",
      "last_used_at": "2025-01-15T12:30:00Z",
      "created_at": "2025-01-15T10:00:00Z",
      "revoked_at": null
    }
  ]
}
```

#### Revoke API Key
```typescript
DELETE /api/v1/api-keys/:id

Headers:
  Authorization: Bearer <session_token>

Response:
{
  "success": true
}
```

#### Verify API Key (for CLI)
```typescript
POST /api/v1/auth/verify

Headers:
  Authorization: Bearer kg_xxxxx

Response:
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "pro"
  }
}
```

## 2. Scan History

### Database Schema

```typescript
// schema.ts
export const scans = pgTable("scans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename"),
  language: text("language"),
  code: text("code"), // Store original code
  policy: text("policy").default("moderate"), // strict | moderate | lax
  status: text("status").notNull(), // passed | failed | pending
  vulnerabilityCount: integer("vulnerability_count").default(0),
  scanDurationMs: integer("scan_duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  scanId: text("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  severity: text("severity").notNull(), // critical | high | medium | low
  category: text("category").notNull(), // sql_injection | xss | etc.
  message: text("message").notNull(),
  line: integer("line"),
  column: integer("column"),
  endLine: integer("end_line"),
  endColumn: integer("end_column"),
  codeSnippet: text("code_snippet"),
  suggestion: text("suggestion"),
  cwe: text("cwe"), // CWE-89, etc.
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

### API Endpoints

#### Get Current User Info (for `kg auth whoami`)
```typescript
GET /api/v1/user/me

Headers:
  Authorization: Bearer kg_xxxxx

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "pro",
  "scans_this_month": 45,
  "scan_limit": 1000,
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### Update Scan Endpoint (already exists, but enhance)
```typescript
POST /api/v1/scan

Headers:
  Authorization: Bearer kg_xxxxx

Request:
{
  "code": "def get_user(id): return db.execute(f'SELECT * FROM users WHERE id={id}')",
  "filename": "api.py",
  "language": "python",
  "policy": "strict"
}

Response:
{
  "scan_id": "uuid",
  "status": "failed",
  "vulnerability_count": 1,
  "scan_duration_ms": 1234,
  "vulnerabilities": [
    {
      "id": "uuid",
      "severity": "critical",
      "category": "sql_injection",
      "message": "SQL Injection vulnerability detected",
      "line": 1,
      "column": 28,
      "code_snippet": "f'SELECT * FROM users WHERE id={id}'",
      "suggestion": "Use parameterized queries instead: cursor.execute('SELECT * FROM users WHERE id = ?', (id,))",
      "cwe": "CWE-89"
    }
  ]
}

Note: Also save scan to database for history
```

#### List User Scans (for `kg report list`)
```typescript
GET /api/v1/scans

Headers:
  Authorization: Bearer kg_xxxxx

Query Parameters:
  limit: number (default 10)
  offset: number (default 0)
  status: "passed" | "failed" | "all" (default "all")

Response:
{
  "scans": [
    {
      "id": "uuid",
      "filename": "api.py",
      "language": "python",
      "status": "failed",
      "vulnerability_count": 3,
      "scan_duration_ms": 1234,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 123,
  "limit": 10,
  "offset": 0
}
```

#### Get Scan Details (for `kg report show`)
```typescript
GET /api/v1/scans/:id

Headers:
  Authorization: Bearer kg_xxxxx

Response:
{
  "id": "uuid",
  "filename": "api.py",
  "language": "python",
  "policy": "strict",
  "status": "failed",
  "vulnerability_count": 3,
  "scan_duration_ms": 1234,
  "created_at": "2025-01-15T10:00:00Z",
  "vulnerabilities": [
    {
      "id": "uuid",
      "severity": "critical",
      "category": "sql_injection",
      "message": "SQL Injection vulnerability detected",
      "line": 1,
      "column": 28,
      "code_snippet": "f'SELECT * FROM users WHERE id={id}'",
      "suggestion": "Use parameterized queries",
      "cwe": "CWE-89"
    }
  ]
}
```

#### Export Scan Report (for `kg report export`)
```typescript
GET /api/v1/scans/:id/export

Headers:
  Authorization: Bearer kg_xxxxx

Query Parameters:
  format: "json" | "pdf" | "html" | "sarif"

Response:
  Content-Type: application/json | application/pdf | text/html | application/sarif+json

  [File download based on format]

For SARIF format:
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "KlyntosGuard",
          "version": "1.0.0"
        }
      },
      "results": [
        {
          "ruleId": "sql-injection",
          "level": "error",
          "message": {
            "text": "SQL Injection vulnerability detected"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "api.py"
                },
                "region": {
                  "startLine": 1,
                  "startColumn": 28
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 3. Dashboard Features

### API Keys Management UI

Create new page: `/settings/api-keys`

Features:
- List all API keys with prefix (kg_abc12345...)
- Show last used timestamp
- Button to create new key
- Modal that shows full key (only once)
- Warning about keeping key secret
- Copy to clipboard button
- Revoke key button with confirmation

### Scan History UI

Enhance existing dashboard or create: `/scans`

Features:
- Table of all scans with:
  - Filename
  - Language
  - Status (passed/failed badge)
  - Vulnerability count
  - Date
  - View button
- Pagination
- Filter by status
- Sort by date/filename
- Export to PDF/JSON/SARIF

### Scan Detail Page

Create: `/scans/:id`

Features:
- File information (name, language, date)
- Scan summary (duration, status)
- List of vulnerabilities with:
  - Severity badge (critical/high/medium/low)
  - Category
  - Line number
  - Code snippet with syntax highlighting
  - Suggestion for fix
  - CWE reference
- Export buttons (PDF, JSON, SARIF)
- Re-scan button

## 4. Implementation Plan

### Phase 1: API Key Management (Priority: HIGH)
1. Create database migration for `api_keys` table
2. Implement API key generation with crypto.randomBytes
3. Hash keys with SHA-256 before storage
4. Create API endpoints:
   - POST /api/v1/api-keys (create)
   - GET /api/v1/api-keys (list)
   - DELETE /api/v1/api-keys/:id (revoke)
   - POST /api/v1/auth/verify (verify key)
5. Create settings page UI for API keys
6. Add middleware to accept Bearer tokens with kg_ prefix

### Phase 2: Scan History (Priority: HIGH)
1. Create database migrations for `scans` and `vulnerabilities` tables
2. Update POST /api/v1/scan to save scan results to database
3. Implement scan history endpoints:
   - GET /api/v1/scans (list)
   - GET /api/v1/scans/:id (details)
4. Create scan history dashboard page
5. Create scan detail page

### Phase 3: Report Export (Priority: MEDIUM)
1. Implement SARIF export formatter
2. Implement PDF export with puppeteer or similar
3. Implement HTML export
4. Add export endpoint: GET /api/v1/scans/:id/export
5. Add export buttons to UI

### Phase 4: CLI Testing (Priority: HIGH)
1. Get API key from dashboard
2. Test full CLI flow:
   ```bash
   kg auth login --api-key kg_xxxxx
   kg scan test_vulnerable.py
   kg report list
   kg report show <id>
   kg report export <id> --format sarif
   ```
3. Fix any bugs discovered
4. Document CLI usage

### Phase 5: GitHub Integration (Priority: MEDIUM)
1. Test SARIF upload to GitHub
2. Create GitHub Action examples
3. Document CI/CD integration

## 5. Security Considerations

### API Key Security
- Generate keys with crypto.randomBytes(32) → 64 char hex
- Prefix with `kg_` for easy identification
- Store SHA-256 hash, not plain text
- Show full key only once during creation
- Rate limit API key endpoints
- Log API key usage for security audit

### Authorization
- Verify API key on every request
- Check user's subscription plan
- Enforce scan limits based on plan
- Return 401 for invalid keys
- Return 403 for revoked keys
- Return 429 for rate limits

### Data Privacy
- Users can only access their own scans
- Scans contain sensitive code - ensure proper access control
- Add option to delete scan history
- Consider encryption at rest for code storage

## 6. Testing Checklist

- [ ] Create API key from dashboard
- [ ] Verify key shows full value only once
- [ ] List API keys shows prefix only
- [ ] Revoke API key works
- [ ] CLI can authenticate with API key
- [ ] CLI can scan single file
- [ ] CLI can scan directory recursively
- [ ] Scan results saved to database
- [ ] Scan history shows in dashboard
- [ ] Scan detail page displays correctly
- [ ] SARIF export validates against schema
- [ ] PDF export generates properly
- [ ] GitHub Actions integration works
- [ ] Rate limiting enforced
- [ ] Subscription limits enforced

## 7. Database Migrations

```typescript
// migration file: 20250115_api_keys_and_scans.ts

import { sql } from 'drizzle-orm';

export async function up(db) {
  // API Keys table
  await db.execute(sql`
    CREATE TABLE api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_hash TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      revoked_at TIMESTAMP
    );
  `);

  // Scans table
  await db.execute(sql`
    CREATE TABLE scans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT,
      language TEXT,
      code TEXT,
      policy TEXT DEFAULT 'moderate',
      status TEXT NOT NULL,
      vulnerability_count INTEGER DEFAULT 0,
      scan_duration_ms INTEGER,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  // Vulnerabilities table
  await db.execute(sql`
    CREATE TABLE vulnerabilities (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      line INTEGER,
      column INTEGER,
      end_line INTEGER,
      end_column INTEGER,
      code_snippet TEXT,
      suggestion TEXT,
      cwe TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  // Indexes
  await db.execute(sql`CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);`);
  await db.execute(sql`CREATE INDEX idx_scans_user_id ON scans(user_id);`);
  await db.execute(sql`CREATE INDEX idx_scans_created_at ON scans(created_at DESC);`);
  await db.execute(sql`CREATE INDEX idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);`);
}

export async function down(db) {
  await db.execute(sql`DROP TABLE IF EXISTS vulnerabilities;`);
  await db.execute(sql`DROP TABLE IF EXISTS scans;`);
  await db.execute(sql`DROP TABLE IF EXISTS api_keys;`);
}
```

## Summary

The CLI is complete and ready. Now we need to build backend support to make it fully functional. The priority order is:

1. **API Key Management** - Users need to generate keys
2. **Scan History** - Save and retrieve scan results
3. **Report Export** - Export to SARIF/PDF/JSON
4. **Dashboard UI** - Display scans and API keys

Once these are implemented, users can:
- Generate API keys from dashboard
- Use CLI to scan their code
- View scan history in dashboard
- Export reports for compliance
- Integrate with GitHub Actions
