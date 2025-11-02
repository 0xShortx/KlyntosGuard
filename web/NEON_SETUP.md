# Neon Database Setup for KlyntosGuard

Your Neon database is ready! Here's how to set it up for KlyntosGuard.

## Database Connection

Your Neon database URL (already in `.env.local`):
```
postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Quick Setup

### Option 1: Using Neon Console (Recommended)

1. **Go to Neon Console:**
   - Open https://console.neon.tech
   - Select your project

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar

3. **Run Migration:**
   - Copy the contents of `migrations/001_create_guard_api_keys.sql`
   - Paste into SQL Editor
   - Click "Run"

### Option 2: Using psql CLI

```bash
# Install psql if you don't have it
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql-client

# Run migration
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f migrations/001_create_guard_api_keys.sql
```

### Option 3: Using Node.js Script

Create and run this script:

```javascript
// scripts/migrate.js
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Running migration...');

  const migration = readFileSync('./migrations/001_create_guard_api_keys.sql', 'utf8');

  await sql(migration);

  console.log('✓ Migration complete!');
}

migrate().catch(console.error);
```

Run it:
```bash
node scripts/migrate.js
```

## Verify Tables Were Created

### Using Neon Console

1. Go to Neon Console → Tables
2. You should see:
   - `guard_api_keys`
   - `guard_usage`

### Using psql

```bash
psql "$DATABASE_URL" -c "\dt"
```

You should see:
```
 Schema |       Name        | Type  |    Owner
--------+-------------------+-------+--------------
 public | guard_api_keys    | table | neondb_owner
 public | guard_usage       | table | neondb_owner
```

## Test the Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Start Dev Server

```bash
npm run dev
```

### 3. Test in Browser

Open http://localhost:3001/settings/cli

Try generating an API key!

## Troubleshooting

### Connection Error

If you get connection errors:

1. **Check SSL mode:**
   Make sure your DATABASE_URL includes `?sslmode=require`

2. **Check Neon project status:**
   - Go to Neon Console
   - Make sure project is not suspended

3. **Test connection:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1"
   ```

### Migration Fails

If migration fails:

1. **Check if tables already exist:**
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   ```

2. **Drop tables if needed:**
   ```sql
   DROP TABLE IF EXISTS guard_usage;
   DROP TABLE IF EXISTS guard_api_keys;
   ```

3. **Run migration again**

### Can't Generate API Keys

If you can't generate keys in the UI:

1. **Check browser console** for errors
2. **Check dev server logs** for errors
3. **Verify tables exist:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM guard_api_keys LIMIT 1"
   ```

## Next Steps

After migration is complete:

1. ✅ Tables created
2. ✅ Web app running (`npm run dev`)
3. ✅ Generate an API key at http://localhost:3001/settings/cli
4. ✅ Test CLI login:
   ```bash
   kg auth login --api-key kg_your_key_here
   ```

## Stack Auth (Optional - For Production)

Your Neon database comes with Stack Auth credentials:

```env
NEXT_PUBLIC_STACK_PROJECT_ID="7f17f52b-4890-49f3-ac38-bc10d962c786"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="pck_7krq5wh7fv26j105n0vz0rt5xfywn60nkgw8mkgs3mg08"
STACK_SECRET_SERVER_KEY="ssk_sd78t8w82x99khkkqans42ckbps08q5t94fs7hdbsr8xr"
```

These are already in your `.env.local`. You can use Stack Auth instead of Better Auth if you prefer!

## Database Management

### View Data

```bash
# List all API keys
psql "$DATABASE_URL" -c "SELECT prefix, name, is_active, created_at FROM guard_api_keys"

# Count keys
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM guard_api_keys"
```

### Clear All Keys (Be Careful!)

```bash
psql "$DATABASE_URL" -c "DELETE FROM guard_api_keys"
```

## Neon Features

Your database includes:

- ✅ **Connection Pooling** - Handles many connections
- ✅ **Serverless** - Scales automatically
- ✅ **Branching** - Create dev/staging branches
- ✅ **Backups** - Automatic backups
- ✅ **SSL** - Secure connections

## Resources

- [Neon Console](https://console.neon.tech)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle + Neon Guide](https://orm.drizzle.team/docs/get-started-postgresql#neon)

---

**Ready!** Your Neon database is configured and ready for KlyntosGuard. Run the migration and start the dev server! 🚀
