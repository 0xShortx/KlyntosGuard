# 🛡️ KlyntosGuard - START HERE

Welcome! Your authentication bridge between web and CLI is ready.

---

## 🎯 What You're Setting Up

A complete authentication system that lets users:
1. Sign up on your web app at `guard.klyntos.com`
2. Generate CLI API keys in Settings
3. Login to CLI with: `kg auth login --api-key <key>`
4. Use both web and CLI with the same account

---

## ⚡ Quick Setup (30 seconds)

```bash
cd web
npm install
npm run db:setup
```

Then visit: http://localhost:3001/settings/cli

**That's it!** 🎉

---

## 📖 Detailed Guides

Choose based on your preference:

### 🚀 Just Get It Running
→ **[web/SETUP_NOW.md](web/SETUP_NOW.md)** - One command setup

### 📚 Step-by-Step Guide
→ **[WEB_QUICK_START.md](WEB_QUICK_START.md)** - Detailed walkthrough with explanations

### 🏗️ Understanding the Architecture
→ **[BRIDGE_AUTH_GUIDE.md](BRIDGE_AUTH_GUIDE.md)** - How it all works

### 🗄️ Database Management
→ **[web/NEON_SETUP.md](web/NEON_SETUP.md)** - Neon database guide

### 🔍 Complete Reference
→ **[WEB_APP_COMPLETE.md](WEB_APP_COMPLETE.md)** - All implementation details

---

## 🎬 Quick Demo

### Terminal 1: Start Web App
```bash
cd web
npm run db:setup
```

### Terminal 2: Test CLI
```bash
# Visit http://localhost:3001/settings/cli
# Generate key, then:

kg auth login --api-key kg_abc123...
kg chat "Hello, world!"
```

---

## 📁 Project Structure

```
KlyntosGuard/
├── START_HERE.md              ← You are here
├── READY_TO_RUN.md            ← Overview and checklist
├── WEB_QUICK_START.md         ← Detailed setup guide
├── BRIDGE_AUTH_GUIDE.md       ← Architecture docs
├── WEB_APP_COMPLETE.md        ← Implementation details
│
├── web/                       ← Next.js Web App
│   ├── SETUP_NOW.md          ← ⚡ Quick setup guide
│   ├── NEON_SETUP.md         ← Database guide
│   ├── .env.local            ← ✅ Configured with Neon
│   ├── package.json          ← ✅ Dependencies ready
│   ├── scripts/
│   │   └── run-migration.mjs ← ✅ Automated migration
│   ├── migrations/
│   │   └── 001_create_guard_api_keys.sql
│   └── src/
│       ├── app/
│       │   ├── api/cli/      ← API endpoints
│       │   └── settings/cli/ ← Settings UI
│       ├── components/ui/    ← Shadcn components
│       └── lib/db/           ← Database layer
│
└── src/klyntos_guard/
    └── cli/
        └── enhanced_cli.py   ← ✅ API key login support
```

---

## 🔥 Common Commands

```bash
# Web Development
cd web
npm install              # Install dependencies
npm run migrate          # Run database migration
npm run dev              # Start dev server (port 3001)
npm run build            # Build for production
npm run db:setup         # Migrate + Start (all-in-one!)

# CLI Usage
kg auth login --api-key <key>   # Login with API key
kg auth status                   # Check login status
kg auth logout                   # Logout
kg chat "Hello"                  # Test guardrails
```

---

## ✅ Success Path

Follow this order:

1. **[web/SETUP_NOW.md](web/SETUP_NOW.md)** → Get it running (5 min)
2. **Test the flow** → Generate key, login, use CLI
3. **[WEB_QUICK_START.md](WEB_QUICK_START.md)** → Understand what you built
4. **[BRIDGE_AUTH_GUIDE.md](BRIDGE_AUTH_GUIDE.md)** → Learn the architecture
5. **[authguide.md](authguide.md)** → Set up Better Auth (optional)

---

## 🎯 Your Mission

Get this working:

```bash
# Terminal 1
cd web && npm run db:setup

# Terminal 2
kg auth login --api-key <your-generated-key>
kg chat "Hello!"
```

When that works, you're done! 🎉

---

## 🆘 Need Help?

**Web app won't start?**
→ Check [web/SETUP_NOW.md](web/SETUP_NOW.md) troubleshooting section

**Database issues?**
→ Check [web/NEON_SETUP.md](web/NEON_SETUP.md)

**CLI not connecting?**
→ Make sure web app is running: `npm run dev`

**JWT errors?**
→ Ensure JWT secrets match in `web/.env.local` and Python API `.env`

---

## 🎊 Ready?

Open your terminal and run:

```bash
cd web && npm run db:setup
```

See you at http://localhost:3001/settings/cli! 🚀
