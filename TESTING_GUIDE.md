# KlyntosGuard Testing Guide

Complete guide to test your Guard app.

---

## 🌐 Your URLs

### Public (via ngrok)
**URL:** https://25db9fe544cc.ngrok-free.app

This is your public URL that works from anywhere!

### Local
**URL:** http://localhost:3001

For local testing on your machine.

---

## ✅ What's Running

1. **Next.js Web App** - Port 3001 ✅
2. **ngrok Tunnel** - Public access ✅
3. **Stripe CLI** - Webhook forwarding ✅
4. **Neon Database** - Connected ✅

---

## 🔑 Do You Need API Keys?

### ❌ NO API Keys Needed for These Features

**You can test right now without any external API keys:**

1. **Web UI** ✅
   - Settings page works
   - Pricing page works
   - All navigation works

2. **API Key Generation** ✅
   - Generate CLI keys
   - List keys
   - Revoke keys
   - All works without external APIs

3. **Database Operations** ✅
   - Saves API keys
   - Tracks usage
   - Stores subscriptions
   - All database features work

4. **Stripe Checkout** (if you add Stripe keys) ✅
   - Just needs Stripe test keys
   - No other platform needed

### ✅ API Keys Needed Only For

**These features need external platform API keys:**

1. **OpenAI/Anthropic** (for actual guardrails processing)
   - When you want to process code through AI models
   - Not needed for testing the web UI

2. **Better Auth** (for real user authentication)
   - Optional - currently using mock users
   - Can add later when deploying to production

---

## 🧪 Test Plan (No API Keys Required!)

### Test 1: Access Web App Publicly

**Via ngrok (anyone can access):**
```
https://25db9fe544cc.ngrok-free.app
```

**Expected:** Homepage loads

### Test 2: Settings Page

**URL:**
```
https://25db9fe544cc.ngrok-free.app/settings/cli
```

**Test:**
1. Click "Generate Key"
2. Enter name: "Test Key"
3. Click generate
4. Copy the key (starts with `kg_...`)

**Expected:** Key appears and can be copied

### Test 3: Pricing Page

**URL:**
```
https://25db9fe544cc.ngrok-free.app/pricing
```

**Test:**
1. Toggle Monthly/Yearly
2. Check prices update
3. Check savings calculation

**Expected:** Beautiful pricing page with working toggle

### Test 4: Database Verification

**Check API key was saved:**
```bash
psql "postgresql://neondb_owner:npg_Jne76tCwaXON@ep-icy-rice-adyfyan5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT prefix, name, is_active, created_at FROM guard_api_keys ORDER BY created_at DESC LIMIT 5;"
```

**Expected:** Shows your test keys

### Test 5: API Endpoints (via cURL)

**Generate API key:**
```bash
curl -X POST https://25db9fe544cc.ngrok-free.app/api/cli/generate-key \
  -H "Content-Type: application/json" \
  -d '{"name": "Test via cURL"}'
```

**Expected:** Returns JSON with API key

**Verify key:**
```bash
curl -X POST https://25db9fe544cc.ngrok-free.app/api/cli/verify-key \
  -H "Content-Type: application/json" \
  -d '{"api_key": "YOUR_KEY_FROM_ABOVE"}'
```

**Expected:** Returns JWT token

### Test 6: List Keys

```bash
curl https://25db9fe544cc.ngrok-free.app/api/cli/keys
```

**Expected:** Returns list of API keys

---

## 🎯 What Works Without Platform API Keys

### ✅ Fully Functional Now

**Web Application:**
- All pages load
- Settings UI works
- Pricing page works
- API key generation
- API key verification
- JWT token generation
- Database operations

**API Endpoints:**
- `/api/cli/generate-key` ✅
- `/api/cli/verify-key` ✅
- `/api/cli/keys` (GET/DELETE) ✅
- `/api/subscriptions/status` ✅
- `/api/subscriptions/checkout` ✅
- `/api/subscriptions/portal` ✅
- `/api/webhooks/stripe` ✅

**CLI Integration:**
- `kg auth login --api-key <key>` ✅
- `kg subscription current` ✅
- `kg subscription upgrade` ✅

### ⏳ Needs Platform Keys

**These features require external API keys:**

**1. Actual Code Guardrails Processing**
   - Needs: OpenAI API key or Anthropic API key
   - Used for: Running AI models to check code
   - Optional for testing web UI

**2. Production User Authentication**
   - Needs: Better Auth configured
   - Used for: Real user login/signup
   - Currently using mock users (works fine for testing)

---

## 📋 API Keys You Might Add (Optional)

### Stripe (For Checkout Testing)

**Get from:** https://dashboard.stripe.com/test/apikeys

**Add to `.env.local`:**
```bash
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

**Also need:** Price IDs (create in Stripe Dashboard)

### OpenAI (For Guardrails)

**Get from:** https://platform.openai.com/api-keys

**Add to Python API `.env`:**
```bash
OPENAI_API_KEY="sk-..."
```

**Used for:** Actual code processing with AI

### Anthropic (Alternative for Guardrails)

**Get from:** https://console.anthropic.com/

**Add to Python API `.env`:**
```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

**Used for:** Claude-based code processing

---

## 🚀 Quick Testing Sequence

**1. Open ngrok URL in browser:**
```
https://25db9fe544cc.ngrok-free.app
```

**2. Go to Settings:**
```
https://25db9fe544cc.ngrok-free.app/settings/cli
```

**3. Generate a key:**
- Click "Generate Key"
- Name: "My Test Key"
- Copy the key

**4. Test in another browser/incognito:**
Open the same ngrok URL - it works publicly!

**5. Check database:**
```bash
psql "$DATABASE_URL" -c "SELECT * FROM guard_api_keys;"
```

**6. Try the pricing page:**
```
https://25db9fe544cc.ngrok-free.app/pricing
```

---

## 🎊 Summary

**YOU DON'T NEED ANY PLATFORM API KEYS TO TEST!**

Everything works without:
- OpenAI API key
- Anthropic API key
- Better Auth setup

**What you can test right now:**
✅ Web UI (all pages)
✅ API key generation
✅ Database operations
✅ API endpoints
✅ CLI integration
✅ Public access (via ngrok)

**Optional to add:**
- Stripe keys (for checkout testing)
- OpenAI/Anthropic keys (for actual guardrails)
- Better Auth (for production users)

---

## 🔗 Important URLs

**Your App (Public):**
```
https://25db9fe544cc.ngrok-free.app
```

**Settings:**
```
https://25db9fe544cc.ngrok-free.app/settings/cli
```

**Pricing:**
```
https://25db9fe544cc.ngrok-free.app/pricing
```

**ngrok Dashboard (see traffic):**
```
http://localhost:4040
```

---

## 🎯 Next Step

**Go ahead and test!** Open:

```
https://25db9fe544cc.ngrok-free.app/settings/cli
```

Generate a key and let me know how it works! 🚀

**No API keys needed for this test!**
