# 🚀 Vercel Deployment Guide (Quick Start)

Since your Neon database is already connected to Vercel with the `storage_` prefix, deployment is simpler than expected!

---

## ✅ What Vercel Already Has

When you connected your Neon database through Vercel's integration, it automatically created these environment variables:

```bash
storage_DATABASE_URL=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
storage_DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
storage_PGHOST=ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech
storage_PGHOST_UNPOOLED=ep-holy-night-ad39jkqj.c-2.us-east-1.aws.neon.tech
storage_PGUSER=neondb_owner
storage_PGDATABASE=neondb
storage_PGPASSWORD=npg_XQxkJME50Dsq
```

**The database connection is already set up!** ✅

---

## 🔧 Code Update

I've updated `/web/src/lib/db/index.ts` to automatically detect and use Vercel's `storage_DATABASE_URL`:

```typescript
// Support both local DATABASE_URL and Vercel's storage_DATABASE_URL
const databaseUrl = process.env.storage_DATABASE_URL || process.env.DATABASE_URL
```

**This means:**
- ✅ Local development uses `DATABASE_URL` from `.env.local`
- ✅ Vercel production uses `storage_DATABASE_URL` automatically
- ✅ No additional configuration needed!

---

## 📝 Environment Variables to Add in Vercel

Go to: https://vercel.com/[your-username]/klyntos-guard/settings/environment-variables

Add these for **Production** environment:

### Critical (Authentication)
```bash
BETTER_AUTH_SECRET="+b1P/m1g2q4ciqKo+NaKrKNFP8FJELiJXipO18yorBc="
BETTER_AUTH_URL="https://guard.klyntos.com"
NEXT_PUBLIC_APP_URL="https://guard.klyntos.com"
ENCRYPTION_KEY="b4a28a59f8c42f21855c269c1f4e92b0058d89976b82c59c9fd3dcee95784508"
```

### OAuth (Google - Already Have)
```bash
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
```

### OAuth (GitHub - Optional)
```bash
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

### API Keys
```bash
ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
JWT_SECRET_KEY="your-jwt-secret-change-me-min-32-chars"
JWT_ALGORITHM="HS256"
```

### Stripe (Optional - for subscriptions)
```bash
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_PRODUCTION_WEBHOOK_SECRET"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PUBLISHABLE_KEY"

# Product/Price IDs (from Stripe Dashboard)
STRIPE_GUARD_BASIC_PRODUCT_ID="prod_xxx"
STRIPE_GUARD_PRO_PRODUCT_ID="prod_xxx"
STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID="price_xxx"
STRIPE_GUARD_PRO_MONTHLY_PRICE_ID="price_xxx"
```

---

## 🚀 Deploy Now!

### Option 1: Deploy via Git (Recommended)

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
git add .
git commit -m "feat: production-ready authentication with Better Auth"
git push origin main
```

Vercel will auto-deploy! ✅

### Option 2: Deploy via Vercel CLI

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
vercel --prod
```

---

## ✅ Post-Deployment Checklist

After deployment completes:

### 1. Test Authentication (5 minutes)

Visit https://guard.klyntos.com/signup and:

- [ ] Create account with email/password
- [ ] Verify welcome page shows your name
- [ ] Sign in at https://guard.klyntos.com/login
- [ ] Dashboard shows "Welcome back, [Name]"
- [ ] Click "SIGN OUT" - redirects to login
- [ ] Try Google OAuth signup (if configured)

### 2. Verify Database (2 minutes)

Check that production users are being created:

```bash
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT id, name, email, created_at FROM \"user\" ORDER BY created_at DESC LIMIT 5;"
```

### 3. Check Vercel Logs (if issues)

```bash
vercel logs guard.klyntos.com --prod
```

Or visit: https://vercel.com/[your-username]/klyntos-guard/deployments

---

## 🎯 What You Need to Do (Summary)

1. **Add environment variables to Vercel** (10 minutes)
   - Open Vercel project → Settings → Environment Variables
   - Copy from list above
   - Save

2. **Deploy** (2 minutes)
   ```bash
   git add .
   git commit -m "feat: production auth ready"
   git push origin main
   ```

3. **Test** (5 minutes)
   - Visit https://guard.klyntos.com/signup
   - Create account
   - Verify it works

**Total time: ~15-20 minutes** ⏱️

---

## 🔥 Critical URLs to Verify

Before deploying, make sure these are correct in OAuth apps:

### Google OAuth
- ✅ Redirect URI: `https://guard.klyntos.com/api/auth/callback/google`
- Go to: https://console.cloud.google.com/apis/credentials
- Verify this redirect is added

### GitHub OAuth (if using)
- ✅ Redirect URI: `https://guard.klyntos.com/api/auth/callback/github`
- Go to: https://github.com/settings/developers
- Verify callback URL matches

---

## 🐛 Common Issues & Fixes

### "Database connection failed"
**Cause:** `storage_DATABASE_URL` not accessible
**Fix:** Check that Neon integration is active in Vercel project settings

### "Authentication redirect failed"
**Cause:** `BETTER_AUTH_URL` is wrong or missing
**Fix:** Verify it's set to `https://guard.klyntos.com` (no trailing slash)

### "OAuth callback mismatch"
**Cause:** OAuth app callback doesn't match production URL
**Fix:** Update OAuth app settings to use `https://guard.klyntos.com/api/auth/callback/*`

### "Session not persisting"
**Cause:** Cookie domain mismatch or HTTPS issue
**Fix:** Verify domain is deployed with SSL and `BETTER_AUTH_URL` is HTTPS

---

## 📊 Environment Variables Checklist

Copy this list when adding to Vercel:

```bash
# Authentication (Required)
BETTER_AUTH_SECRET="+b1P/m1g2q4ciqKo+NaKrKNFP8FJELiJXipO18yorBc="
BETTER_AUTH_URL="https://guard.klyntos.com"
NEXT_PUBLIC_APP_URL="https://guard.klyntos.com"
ENCRYPTION_KEY="b4a28a59f8c42f21855c269c1f4e92b0058d89976b82c59c9fd3dcee95784508"

# Google OAuth (Required for Google login)
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# GitHub OAuth (Optional)
# GITHUB_CLIENT_ID="your_client_id"
# GITHUB_CLIENT_SECRET="your_client_secret"

# API Keys (Required for scanning)
ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
JWT_SECRET_KEY="your-jwt-secret-change-me-min-32-chars"
JWT_ALGORITHM="HS256"

# Stripe (Optional - for paid subscriptions)
# STRIPE_SECRET_KEY="sk_live_xxx"
# STRIPE_WEBHOOK_SECRET="whsec_xxx"
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx"

# API URL (for Python backend - update when deployed)
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Database (Already set by Vercel Neon integration)
# storage_DATABASE_URL - Auto-set ✅
# storage_DATABASE_URL_UNPOOLED - Auto-set ✅
```

---

## 🎉 You're Ready to Deploy!

**The database is already connected** thanks to Vercel's Neon integration. All you need to do is:

1. Add environment variables (10 min)
2. Push to GitHub (1 min)
3. Wait for deployment (2-3 min)
4. Test at https://guard.klyntos.com/signup (5 min)

**Total: ~20 minutes to production!** 🚀

---

**Next Steps:**
1. Open Vercel dashboard
2. Go to Settings → Environment Variables
3. Add the variables from the checklist above
4. Run: `git push origin main`
5. Visit: https://guard.klyntos.com/signup
6. Celebrate! 🎉
