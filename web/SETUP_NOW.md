# 🚀 One-Command Setup

Get KlyntosGuard running in **30 seconds**!

---

## ⚡ Quick Start

```bash
cd web
npm install
npm run db:setup
```

That's it! The web app will:
1. ✅ Install all dependencies
2. ✅ Run database migration on Neon
3. ✅ Start the dev server at http://localhost:3001

---

## 📋 What Just Happened?

### `npm install`
Installed:
- Next.js 15 + React 19
- Drizzle ORM + Neon serverless driver
- Shadcn UI components
- JWT and security libraries

### `npm run migrate`
Created in your Neon database:
- ✅ `guard_api_keys` table (stores CLI API keys)
- ✅ `guard_usage` table (tracks API usage)
- ✅ 6 indexes for fast lookups

### `npm run dev`
Started Next.js dev server:
- 🌐 Web UI: http://localhost:3001
- ⚙️ Settings: http://localhost:3001/settings/cli

---

## 🎯 Test It Now!

### 1. Generate API Key

Visit: http://localhost:3001/settings/cli

```
Name: My Laptop
↓
Click "Generate Key"
↓
Copy: kg_abc123...
```

### 2. Login with CLI

```bash
kg auth login --api-key kg_abc123...
```

Expected output:
```
✓ Successfully logged in as user@example.com
You're now authenticated with your web account!
```

### 3. Verify It Works

```bash
kg chat "Hello, world!"
```

### 4. Check Web UI

Refresh http://localhost:3001/settings/cli

You should see:
- **Status:** ✓ Active
- **Last used:** Just now

---

## 🔧 Individual Commands

If you prefer to run steps separately:

```bash
# Install dependencies
npm install

# Run migration only
npm run migrate

# Start dev server only
npm run dev
```

---

## 🐛 Troubleshooting

### Migration already ran?

```
✅ Tables already exist! You're good to go.
```

This is fine! Just run:
```bash
npm run dev
```

### Connection error?

Check your `.env.local`:
```bash
cat .env.local | grep DATABASE_URL
```

Should show your Neon database URL with `?sslmode=require`

### Port 3001 in use?

Kill the process:
```bash
lsof -ti:3001 | xargs kill -9
npm run dev
```

---

## ✅ Success Checklist

- [ ] `npm install` completed
- [ ] `npm run migrate` created tables
- [ ] `npm run dev` started server
- [ ] http://localhost:3001 loads
- [ ] http://localhost:3001/settings/cli loads
- [ ] Can generate API key
- [ ] Can copy key to clipboard
- [ ] `kg auth login --api-key <key>` works
- [ ] `kg chat "test"` works

---

## 📚 Next Steps

### Production Ready

1. **Update JWT Secret** in `.env.local`:
   ```env
   JWT_SECRET_KEY="your-super-secure-random-32-char-minimum"
   ```

2. **Set up Better Auth** (optional for now):
   - See [../authguide.md](../authguide.md)
   - Replace mock user IDs in API routes

3. **Deploy to Vercel**:
   ```bash
   npm run build
   vercel deploy
   ```

### Documentation

- **[WEB_QUICK_START.md](../WEB_QUICK_START.md)** - Detailed setup guide
- **[NEON_SETUP.md](NEON_SETUP.md)** - Database management
- **[WEB_APP_COMPLETE.md](../WEB_APP_COMPLETE.md)** - Full implementation
- **[BRIDGE_AUTH_GUIDE.md](../BRIDGE_AUTH_GUIDE.md)** - Architecture

---

## 🎉 You're Ready!

Your KlyntosGuard authentication bridge is running!

**Quick test:**
1. Visit http://localhost:3001/settings/cli
2. Generate API key
3. Run: `kg auth login --api-key <key>`
4. Run: `kg chat "Hello!"`

Everything working? You're all set! 🛡️🚀
