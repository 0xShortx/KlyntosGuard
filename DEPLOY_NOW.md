# 🚀 Deploy KlyntosGuard to Production NOW

## ⚡ Quick Deploy (20 Minutes)

Your authentication works perfectly locally. Here's what you need to deploy to production at **https://guard.klyntos.com**.

---

## ✅ What's Already Done

- ✅ Database connected to Vercel (with `storage_` prefix)
- ✅ Code updated to use `storage_DATABASE_URL`
- ✅ All auth tables migrated
- ✅ Google OAuth production credentials ready
- ✅ Authentication tested end-to-end locally

---

## 📝 Step 1: Add Environment Variables (10 min)

Go to: **https://vercel.com → Your Project → Settings → Environment Variables**

Add these for **Production** environment:

```bash
# === REQUIRED (Authentication) ===
BETTER_AUTH_SECRET="+b1P/m1g2q4ciqKo+NaKrKNFP8FJELiJXipO18yorBc="
BETTER_AUTH_URL="https://guard.klyntos.com"
NEXT_PUBLIC_APP_URL="https://guard.klyntos.com"
ENCRYPTION_KEY="b4a28a59f8c42f21855c269c1f4e92b0058d89976b82c59c9fd3dcee95784508"

# === REQUIRED (Google OAuth) ===
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# === REQUIRED (API Keys) ===
ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
JWT_SECRET_KEY="your-jwt-secret-change-me-min-32-chars"
JWT_ALGORITHM="HS256"

# === OPTIONAL (API URL - update when Python backend deployed) ===
NEXT_PUBLIC_API_URL="http://localhost:8000"

# === OPTIONAL (GitHub OAuth - if you want GitHub login) ===
# GITHUB_CLIENT_ID="your_github_client_id"
# GITHUB_CLIENT_SECRET="your_github_client_secret"

# === OPTIONAL (Stripe - for paid subscriptions) ===
# STRIPE_SECRET_KEY="sk_live_xxx"
# STRIPE_WEBHOOK_SECRET="whsec_xxx"
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
```

**Note:** Database variables (`storage_DATABASE_URL`) are already set by Vercel's Neon integration! ✅

---

## 🚀 Step 2: Deploy (2 min)

### Option A: Deploy via Git (Recommended)

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
git add .
git commit -m "feat: production-ready authentication with Better Auth"
git push origin main
```

### Option B: Deploy via Vercel CLI

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
vercel --prod
```

Vercel will automatically deploy! Wait 2-3 minutes for build to complete.

---

## ✅ Step 3: Test Production (5 min)

Once deployed, visit **https://guard.klyntos.com/signup**

### Test Checklist:

1. **Create Account**
   - [ ] Visit https://guard.klyntos.com/signup
   - [ ] Fill in name, email, password (8+ chars)
   - [ ] Click "CREATE ACCOUNT"
   - [ ] See welcome page with your name

2. **Sign In**
   - [ ] Visit https://guard.klyntos.com/login
   - [ ] Enter email and password
   - [ ] Click "SIGN IN"
   - [ ] Dashboard shows "Welcome back, [Name]"

3. **Sign Out**
   - [ ] Click "SIGN OUT" button
   - [ ] Redirected to login page

4. **Google OAuth** (if configured)
   - [ ] Visit https://guard.klyntos.com/signup
   - [ ] Click "Continue with Google"
   - [ ] Authorize app
   - [ ] See welcome page

5. **Route Protection**
   - [ ] Sign out
   - [ ] Try to visit https://guard.klyntos.com/dashboard
   - [ ] Should redirect to login
   - [ ] Sign in
   - [ ] Should redirect back to dashboard

---

## 🔍 Step 4: Verify Database (Optional)

Check that production users are being created:

```bash
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT id, name, email, created_at FROM \"user\" ORDER BY created_at DESC LIMIT 5;"
```

---

## 🐛 Troubleshooting

### Deployment fails?
```bash
# Check Vercel logs
vercel logs guard.klyntos.com --prod
```

### Authentication not working?
1. Verify `BETTER_AUTH_SECRET` is set in Vercel
2. Check `BETTER_AUTH_URL` is exactly `https://guard.klyntos.com` (no trailing slash)
3. Verify Google OAuth redirect URI includes `https://guard.klyntos.com/api/auth/callback/google`

### Database connection fails?
1. Check Vercel → Project Settings → Storage
2. Verify Neon integration is connected
3. Check that `storage_DATABASE_URL` exists in environment variables

### Can't see logs?
Go to: https://vercel.com → Your Project → Deployments → Click latest → Functions tab

---

## 📊 What Happens When You Deploy

1. **Vercel builds your app** (2 min)
   - Installs dependencies
   - Builds Next.js production bundle
   - Optimizes assets

2. **Deploys to edge network** (30 sec)
   - Deploys to global CDN
   - Connects to Neon database
   - Sets up serverless functions

3. **Your app goes live** ✅
   - Available at https://guard.klyntos.com
   - Uses production database
   - SSL enabled automatically

---

## 🎯 Summary

**What you need to do:**

1. ✅ Add 11 environment variables to Vercel (copy from list above)
2. ✅ Run `git push origin main`
3. ✅ Wait 2-3 minutes
4. ✅ Test at https://guard.klyntos.com/signup

**That's it!** Your authentication system will be live in production! 🚀

---

## 📚 Documentation Reference

- **[VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)** - Detailed deployment guide
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Complete checklist
- **[DATABASE_MIGRATION_COMPLETE.md](DATABASE_MIGRATION_COMPLETE.md)** - Database setup details
- **[READY_TO_TEST.md](READY_TO_TEST.md)** - Local testing guide

---

## ⏱️ Time Estimate

- Add environment variables: **10 minutes**
- Git push and deploy: **2 minutes**
- Deployment build time: **2-3 minutes**
- Testing: **5 minutes**

**Total: ~20 minutes** to production! 🎉

---

**Ready? Start with Step 1!** 👆

Open Vercel dashboard and add those environment variables. Then come back and run `git push origin main`. You'll be live in production in 20 minutes! 🚀
