# KlyntosGuard Web App - Quick Start 🚀

Get your KlyntosGuard web app running and bridge it with the CLI in 5 minutes!

## What You'll Get

- ✅ Beautiful web UI at http://localhost:3001
- ✅ API key management page
- ✅ CLI authentication with web-generated keys
- ✅ Single user account across web and CLI

---

## Step 1: Install Dependencies

```bash
cd web
npm install
```

This installs:
- Next.js 15 + React 19
- Drizzle ORM + Neon serverless driver
- Shadcn UI components
- JWT and security libraries

---

## Step 2: Run Database Migration

Choose one of these methods:

### Method A: Neon Console (Easiest) ⭐

1. Open https://console.neon.tech
2. Select your project
3. Click **"SQL Editor"** in sidebar
4. Open `web/migrations/001_create_guard_api_keys.sql`
5. Copy the entire file
6. Paste into SQL Editor
7. Click **"Run"**

### Method B: psql Command Line

```bash
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f migrations/001_create_guard_api_keys.sql
```

### Method C: Node.js Script

Create `scripts/migrate.js`:

```javascript
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);
const migration = readFileSync('./migrations/001_create_guard_api_keys.sql', 'utf8');

await sql(migration);
console.log('✓ Migration complete!');
```

Run:
```bash
node scripts/migrate.js
```

---

## Step 3: Verify Tables Created

```bash
# Connect to your database
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# List tables
\dt

# Expected output:
#  guard_api_keys
#  guard_usage
```

Or via SQL:
```bash
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
```

---

## Step 4: Configure JWT Secret

Edit `web/.env.local`:

```env
# IMPORTANT: Change this to a secure random string!
JWT_SECRET_KEY="your-super-secure-random-jwt-secret-min-32-characters-long"
```

**Critical:** This JWT secret MUST match your Python API's JWT secret!

---

## Step 5: Start the Web App

```bash
npm run dev
```

Output:
```
▲ Next.js 15.0.3
- Local:        http://localhost:3001
- Ready in 1.2s
```

Open http://localhost:3001

---

## Step 6: Test the Full Flow 🧪

### 6.1 Generate an API Key

1. Visit http://localhost:3001/settings/cli
2. Enter a name: **"My Laptop"**
3. Click **"Generate Key"**
4. **Copy the key immediately!** (Format: `kg_abc123...`)
   - ⚠️ This is the ONLY time you'll see the full key!

### 6.2 Login with CLI

Open a new terminal:

```bash
# Navigate to project root
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard

# Login with API key
kg auth login --api-key kg_abc123...
```

Expected output:
```
✓ Successfully logged in as user@example.com
You're now authenticated with your web account!
Token saved to ~/.klyntos_guard/auth.json
```

### 6.3 Verify CLI Works

```bash
kg chat "Hello, world!"
```

Should process through guardrails and return a response.

### 6.4 Check Web UI

1. Refresh http://localhost:3001/settings/cli
2. Your key should show:
   - **Name:** My Laptop
   - **Status:** ✓ Active
   - **Last used:** Just now
   - **Created:** Just now

### 6.5 Test Revocation

1. Click **"Revoke"** button
2. Confirm revocation
3. Try CLI login again:
   ```bash
   kg auth login --api-key kg_abc123...
   ```
4. Should fail: `✗ API key verification failed: Invalid API key`

---

## Architecture: How It Works

```
┌────────────────────────────────────────────────────────┐
│              Authentication Bridge                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. Web UI (Next.js)                                   │
│     http://localhost:3001/settings/cli                 │
│                                                         │
│  2. Generate API Key                                    │
│     POST /api/cli/generate-key                         │
│     ├─ Creates random key: kg_abc123...                │
│     ├─ Hashes with SHA-256                             │
│     ├─ Stores hash in Neon database                    │
│     └─ Returns plain key (ONCE!)                       │
│                                                         │
│  3. CLI Login                                           │
│     kg auth login --api-key kg_abc123...               │
│                                                         │
│  4. Verify Key (Bridge!)                               │
│     POST /api/cli/verify-key                           │
│     ├─ Hashes provided key                             │
│     ├─ Matches against database                        │
│     └─ Returns JWT token (7 days)                      │
│                                                         │
│  5. CLI Saves JWT                                       │
│     ~/.klyntos_guard/auth.json                         │
│                                                         │
│  6. CLI Uses JWT                                        │
│     Authorization: Bearer <jwt>                        │
│     └─ Python API validates JWT                        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### ❌ Web App Won't Start

**Error:** `Cannot find module '@neondatabase/serverless'`

**Fix:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Migration Fails

**Error:** `relation "guard_api_keys" already exists`

**Solution:** Tables already exist! You're good to go.

To start fresh:
```sql
DROP TABLE IF EXISTS guard_usage;
DROP TABLE IF EXISTS guard_api_keys;
```

Then run migration again.

---

### ❌ CLI Can't Connect to Web

**Error:** `Connection refused to localhost:3001`

**Fix:** Make sure web app is running:
```bash
cd web
npm run dev
```

---

### ❌ JWT Verification Fails

**Error:** `Invalid token` when using CLI

**Fix:** JWT secrets must match!

Check:
1. `web/.env.local` → `JWT_SECRET_KEY`
2. Python API `.env` → `JWT_SECRET_KEY`

They must be IDENTICAL.

---

### ❌ Database Connection Error

**Error:** `Connection timeout` or `SSL error`

**Fix:** Ensure DATABASE_URL has `?sslmode=require`:

```env
DATABASE_URL="postgresql://...?sslmode=require"
```

---

### ❌ Can't Generate Keys

**Error:** Blank page or errors in browser console

**Fix:**
1. Check browser console (F12)
2. Check terminal for server errors
3. Verify database tables exist:
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   ```

---

## Database Management

### View API Keys

```bash
# List all keys
psql "$DATABASE_URL" -c "SELECT prefix, name, is_active, created_at FROM guard_api_keys"

# Count active keys
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM guard_api_keys WHERE is_active = true"

# Find a specific key
psql "$DATABASE_URL" -c "SELECT * FROM guard_api_keys WHERE prefix = 'kg_abc123'"
```

### View Usage Data

```bash
psql "$DATABASE_URL" -c "SELECT * FROM guard_usage ORDER BY timestamp DESC LIMIT 10"
```

### Clear All Keys (Danger!)

```bash
psql "$DATABASE_URL" -c "DELETE FROM guard_api_keys"
```

---

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── cli/
│   │   │       ├── generate-key/route.ts    # Generate API keys
│   │   │       ├── verify-key/route.ts      # Exchange key → JWT
│   │   │       └── keys/route.ts            # List/revoke keys
│   │   ├── settings/
│   │   │   └── cli/page.tsx                 # Settings UI
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx                   # Shadcn Button
│   │       ├── card.tsx                     # Shadcn Card
│   │       └── input.tsx                    # Shadcn Input
│   └── lib/
│       ├── db/
│       │   ├── schema.ts                    # Drizzle schema
│       │   └── index.ts                     # DB connection
│       └── utils.ts
├── migrations/
│   └── 001_create_guard_api_keys.sql        # SQL migration
├── package.json
├── .env.local                                # Environment vars
└── README.md
```

---

## Common Commands

### Development

```bash
cd web

# Install dependencies
npm install

# Start dev server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database

```bash
# Connect to database
psql "$DATABASE_URL"

# List tables
psql "$DATABASE_URL" -c "\dt"

# View schema
psql "$DATABASE_URL" -c "\d guard_api_keys"
```

### CLI

```bash
# Login with API key
kg auth login --api-key <key>

# Check status
kg auth status

# Logout
kg auth logout

# Use guardrails
kg chat "Hello!"
```

---

## Environment Variables

### Web App (`.env.local`)

```env
# Neon Database
DATABASE_URL="postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT (MUST match Python API!)
JWT_SECRET_KEY="your-super-secure-random-jwt-secret-min-32-characters"
JWT_ALGORITHM="HS256"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Stack Auth (optional)
NEXT_PUBLIC_STACK_PROJECT_ID="7f17f52b-4890-49f3-ac38-bc10d962c786"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pck_7krq5wh7fv26j105n0vz0rt5xfywn60nkgw8mkgs3mg08"
STACK_SECRET_SERVER_KEY="ssk_sd78t8w82x99khkkqans42ckbps08q5t94fs7hdbsr8xr"
```

---

## Success Checklist ✅

- [ ] Dependencies installed (`npm install`)
- [ ] Database migration run successfully
- [ ] Tables visible in Neon console
- [ ] Web app running at http://localhost:3001
- [ ] Can access /settings/cli page
- [ ] Can generate API key
- [ ] Can copy key to clipboard
- [ ] CLI login works with `--api-key`
- [ ] CLI can make authenticated requests
- [ ] Can revoke API key from web UI
- [ ] Revoked key fails in CLI

---

## Next Steps

### Immediate (Testing)

✅ Everything works locally
✅ API key generation working
✅ CLI login working
✅ Web ↔ CLI bridge complete

### Soon (Production)

- [ ] Set up Better Auth for real user authentication
- [ ] Replace mock user IDs in API routes
- [ ] Add login/signup pages
- [ ] Deploy to Vercel
- [ ] Configure domain: guard.klyntos.com
- [ ] Set up monitoring

---

## Documentation

- **[NEON_SETUP.md](web/NEON_SETUP.md)** - Detailed Neon setup guide
- **[WEB_APP_COMPLETE.md](WEB_APP_COMPLETE.md)** - Complete implementation details
- **[BRIDGE_AUTH_GUIDE.md](BRIDGE_AUTH_GUIDE.md)** - Architecture deep dive
- **[authguide.md](authguide.md)** - Better Auth integration (for later)

---

## Support

Need help?

1. Check [WEB_APP_COMPLETE.md](WEB_APP_COMPLETE.md) for detailed docs
2. Check [NEON_SETUP.md](web/NEON_SETUP.md) for Neon-specific issues
3. Review [BRIDGE_AUTH_GUIDE.md](BRIDGE_AUTH_GUIDE.md) for architecture

---

## Ready! 🎉

Your KlyntosGuard web app is ready!

**Quick test:**
```bash
cd web && npm run dev
```

Then visit http://localhost:3001/settings/cli and generate your first API key! 🚀
