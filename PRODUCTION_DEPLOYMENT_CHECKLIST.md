# 🚀 Production Deployment Checklist

Your KlyntosGuard authentication system works perfectly end-to-end locally. Here's everything you need to make it production-ready and deploy to **https://guard.klyntos.com**.

---

## ✅ What Already Works Locally

- ✅ Email/password signup & login
- ✅ User sessions with Better Auth
- ✅ Dashboard with user name
- ✅ Sign out functionality
- ✅ Route protection (middleware)
- ✅ Database (NEW Neon instance connected to Vercel)
- ✅ Google OAuth configured (production credentials ready)
- ✅ Welcome page with personalization

---

## 📋 Production Deployment Steps

### Step 1: Update Vercel Environment Variables

Go to your Vercel project dashboard: https://vercel.com/[your-username]/klyntos-guard/settings/environment-variables

Add/update these variables for **Production** environment:

#### Database (Already Connected via Neon Integration)
```bash
DATABASE_URL=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

> **Note:** Since you connected this database to Vercel via the Neon integration, these might already be set automatically. Check first!

#### Better Auth Configuration
```bash
BETTER_AUTH_SECRET="+b1P/m1g2q4ciqKo+NaKrKNFP8FJELiJXipO18yorBc="
BETTER_AUTH_URL="https://guard.klyntos.com"
NEXT_PUBLIC_APP_URL="https://guard.klyntos.com"
ENCRYPTION_KEY="b4a28a59f8c42f21855c269c1f4e92b0058d89976b82c59c9fd3dcee95784508"
```

#### OAuth (Google - Already Have Credentials)
```bash
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
```

#### OAuth (GitHub - Need to Create)
```bash
# You created this OAuth app already with callback:
# https://guard.klyntos.com/api/auth/callback/github
GITHUB_CLIENT_ID="your_production_github_client_id"
GITHUB_CLIENT_SECRET="your_production_github_client_secret"
```

> **Action Required:** Copy the GitHub OAuth credentials you created earlier for production.

#### JWT (for API authentication)
```bash
JWT_SECRET_KEY="your-jwt-secret-change-me-min-32-chars"
JWT_ALGORITHM="HS256"
```

#### Stripe (for subscriptions)
```bash
# Get these from Stripe Dashboard
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_PRODUCTION_WEBHOOK_SECRET"

# Product IDs (create in Stripe or use test ones)
STRIPE_GUARD_BASIC_PRODUCT_ID="prod_TLbJkn6SWe4Ycg"
STRIPE_GUARD_PRO_PRODUCT_ID="prod_TLbJ96d2ogmcNa"

# Price IDs (create in Stripe)
STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID="price_xxx"
STRIPE_GUARD_BASIC_YEARLY_PRICE_ID="price_xxx"
STRIPE_GUARD_PRO_MONTHLY_PRICE_ID="price_xxx"
STRIPE_GUARD_PRO_YEARLY_PRICE_ID="price_xxx"

# Publishable key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PUBLISHABLE_KEY"
```

#### LLM API (for code scanning)
```bash
ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
```

#### API URLs
```bash
NEXT_PUBLIC_API_URL="http://localhost:8000"  # Update to production Python API when deployed
```

---

### Step 2: OAuth Configuration for Production

#### Google OAuth ✅ (Already Configured)

You already created the production Google OAuth app with callback:
```
https://guard.klyntos.com/api/auth/callback/google
```

**Credentials already in Vercel environment variables!** ✅

#### GitHub OAuth ⚠️ (Verify Configuration)

You created a GitHub OAuth app with callback:
```
https://guard.klyntos.com/api/auth/callback/github
```

**Action Required:**
1. Go to https://github.com/settings/developers
2. Find your "Klyntos Guard" OAuth app
3. Verify callback URL is: `https://guard.klyntos.com/api/auth/callback/github`
4. Copy Client ID and Client Secret
5. Add to Vercel environment variables

---

### Step 3: Stripe Production Setup

#### Switch to Live Mode

1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Toggle from **Test mode** to **Live mode** (top right)

#### Create Live Products & Prices

```bash
# Create Guard Basic Product
stripe products create --name "Guard Basic" --description "1,000 scans/month"

# Create Guard Pro Product
stripe products create --name "Guard Pro" --description "Unlimited scans"

# Create prices (replace prod_xxx with actual product IDs)
stripe prices create --product prod_xxx --unit-amount 2900 --currency usd --recurring interval=month
stripe prices create --product prod_xxx --unit-amount 9900 --currency usd --recurring interval=month
```

#### Set Up Production Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://guard.klyntos.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

### Step 4: Database Migrations (Already Done!)

Your database migrations are already complete:
- ✅ All Better Auth tables created
- ✅ All Guard tables created
- ✅ Indexes created
- ✅ Triggers and functions created

**No action needed!** The production database is the same one you're using locally.

---

### Step 5: Domain Configuration

#### Verify Vercel Domain Setup

1. Go to Vercel project settings → Domains
2. Verify `guard.klyntos.com` is configured
3. Ensure SSL certificate is active
4. Check DNS is pointing correctly

#### Update Better Auth Domain

The middleware is already configured for cross-subdomain cookies:
```typescript
crossSubDomainCookies: {
  enabled: true,
  domain: '.klyntos.com', // Works for guard.klyntos.com and app.klyntos.com
}
```

**Already configured!** ✅

---

### Step 6: Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)

```bash
# Commit your changes
git add .
git commit -m "feat: production-ready authentication with Better Auth"
git push origin main
```

Vercel will automatically deploy! ✅

#### Option B: Deploy via Vercel CLI

```bash
cd web
vercel --prod
```

---

### Step 7: Post-Deployment Testing

Once deployed, test the following:

#### Authentication Flow
- [ ] Visit https://guard.klyntos.com/signup
- [ ] Create account with email/password
- [ ] Verify email is sent (if email verification enabled)
- [ ] Sign in at https://guard.klyntos.com/login
- [ ] Dashboard shows "Welcome back, [Name]"
- [ ] Sign out works
- [ ] Google OAuth signup works
- [ ] GitHub OAuth signup works (if configured)

#### Route Protection
- [ ] Try accessing https://guard.klyntos.com/dashboard without login
- [ ] Should redirect to login page
- [ ] After login, should redirect back to dashboard

#### Database
- [ ] New users are created in production database
- [ ] Sessions persist across page reloads
- [ ] Sign out clears session

#### Check Production Database

```bash
# Count production users
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM \"user\";"

# View production users
psql "postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT id, name, email, created_at FROM \"user\" ORDER BY created_at DESC LIMIT 10;"
```

---

### Step 8: Monitor & Debug

#### Check Vercel Logs

```bash
vercel logs guard.klyntos.com --prod
```

#### Check Better Auth Issues

Common production issues:
- **CORS errors**: Check `trustedOrigins` in `src/lib/auth.ts`
- **Cookie not setting**: Verify `BETTER_AUTH_URL` matches production domain
- **OAuth redirect fails**: Verify callback URLs in OAuth apps
- **Session not persisting**: Check `BETTER_AUTH_SECRET` is set

#### Vercel Runtime Logs

1. Go to Vercel dashboard
2. Click your deployment
3. Go to "Functions" tab
4. Check logs for errors

---

## 🔐 Security Checklist

Before going live, verify:

- [ ] `BETTER_AUTH_SECRET` is strong (32+ characters)
- [ ] All API keys are production keys (not test)
- [ ] OAuth apps use HTTPS callbacks only
- [ ] Stripe webhook secret is production secret
- [ ] Database uses SSL (`sslmode=require`)
- [ ] CORS is restricted to your domain
- [ ] Rate limiting is enabled (if needed)
- [ ] Environment variables are not committed to git

---

## 📊 Environment Variables Summary

### Required for Production

| Variable | Source | Status |
|----------|--------|--------|
| `DATABASE_URL` | Neon (via Vercel integration) | ✅ Auto-set |
| `BETTER_AUTH_SECRET` | Already generated | ✅ Ready |
| `BETTER_AUTH_URL` | https://guard.klyntos.com | ⚠️ Update |
| `NEXT_PUBLIC_APP_URL` | https://guard.klyntos.com | ⚠️ Update |
| `GOOGLE_CLIENT_ID` | Already have | ✅ Ready |
| `GOOGLE_CLIENT_SECRET` | Already have | ✅ Ready |
| `GITHUB_CLIENT_ID` | Need to copy | ⚠️ Action required |
| `GITHUB_CLIENT_SECRET` | Need to copy | ⚠️ Action required |
| `ANTHROPIC_API_KEY` | Already have | ✅ Ready |

### Optional for Full Functionality

| Variable | Source | Status |
|----------|--------|--------|
| `STRIPE_SECRET_KEY` | Stripe live mode | ⚠️ Need live key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | ⚠️ Need to create |
| `STRIPE_*_PRICE_ID` | Stripe prices | ⚠️ Need to create |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | ⚠️ Need live key |

---

## 🚀 Quick Deploy Steps (TL;DR)

```bash
# 1. Update Vercel environment variables (see Step 1 above)
# 2. Verify OAuth callbacks are correct
# 3. Set up Stripe production webhook (optional)
# 4. Deploy

cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
git add .
git commit -m "feat: production-ready authentication"
git push origin main

# Vercel auto-deploys! ✅
```

**Then test:**
1. Visit https://guard.klyntos.com/signup
2. Create account
3. Sign in
4. Verify dashboard shows your name
5. Test sign out

---

## 📝 Production-Ready Checklist

### Critical (Must Do)
- [ ] Update Vercel environment variables (DATABASE_URL, BETTER_AUTH_*, OAuth)
- [ ] Verify OAuth callbacks use https://guard.klyntos.com
- [ ] Deploy to Vercel
- [ ] Test signup/login flow in production
- [ ] Verify users are created in database

### Important (Should Do)
- [ ] Set up Stripe production webhook
- [ ] Create Stripe live products & prices
- [ ] Add production Stripe keys to Vercel
- [ ] Test subscription flow end-to-end

### Optional (Nice to Have)
- [ ] Enable email verification
- [ ] Add password reset flow
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Add rate limiting for auth endpoints
- [ ] Set up automated backups for database

---

## 🎯 Your Current Status

### ✅ Already Configured
- Database (Neon connected to Vercel)
- Better Auth implementation
- Google OAuth credentials
- GitHub OAuth app created
- Authentication UI (login/signup/welcome/dashboard)
- Middleware for route protection
- Session management

### ⚠️ Need to Configure
1. **Vercel Environment Variables** (15 minutes)
   - Copy from `.env.local` to Vercel dashboard
   - Update URLs from localhost to production

2. **Stripe Production** (30 minutes - optional)
   - Switch to live mode
   - Create products & prices
   - Set up webhook
   - Update Vercel env vars

3. **Deploy** (5 minutes)
   - Push to GitHub or run `vercel --prod`
   - Wait for deployment
   - Test production site

**Total Time: ~20-50 minutes** depending on if you set up Stripe.

---

## 🆘 Troubleshooting

### "Authentication failed" in production
- Check `BETTER_AUTH_SECRET` matches in all environments
- Verify `BETTER_AUTH_URL` is `https://guard.klyntos.com`
- Check Vercel logs for specific error

### OAuth not working
- Verify callback URLs use HTTPS and exact domain
- Check OAuth app is not in test mode
- Verify client ID and secret are correct in Vercel

### Database connection failed
- Check `DATABASE_URL` is set in Vercel
- Verify SSL mode is enabled
- Test connection from Vercel logs

### Session not persisting
- Check cookie domain is set to `.klyntos.com`
- Verify HTTPS is enabled (cookies require secure in production)
- Check browser allows third-party cookies

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Stripe Docs**: https://stripe.com/docs

---

**You're almost there!** The hardest part (authentication implementation) is done. Now it's just configuration and deployment! 🚀
