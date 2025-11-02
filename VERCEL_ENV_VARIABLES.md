# Vercel Environment Variables for KlyntosGuard

**Project:** KlyntosGuard Web App
**Domain:** guard.klyntos.com
**GitHub Repo:** https://github.com/0xShortx/KlyntosGuard
**Root Directory:** `web`

---

## 🔗 Deployment Settings

### Project Settings
- **Framework Preset:** Next.js
- **Root Directory:** `web`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 20.x

---

## 🔐 Environment Variables (Copy-Paste to Vercel)

### Database (Shared with Main App)
```
DATABASE_URL=postgresql://neondb_owner:npg_Jne76tCwaXON@ep-icy-rice-adyfyan5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Better Auth (Shared with Main App)
```
BETTER_AUTH_SECRET=+b1P/m1g2q4ciqKo+NaKrKNFP8FJELiJXipO18yorBc=
ENCRYPTION_KEY=b4a28a59f8c42f21855c269c1f4e92b0058d89976b82c59c9fd3dcee95784508
```

### App URLs (Guard-Specific)
```
BETTER_AUTH_URL=https://guard.klyntos.com
NEXT_PUBLIC_APP_URL=https://guard.klyntos.com
```

### JWT Configuration (Guard-Specific)
```
JWT_SECRET_KEY=your-jwt-secret-change-me-min-32-chars
JWT_ALGORITHM=HS256
```

### Stripe (Shared Account, Guard Products)
```
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_GUARD_BASIC_PRODUCT_ID=prod_TLbJkn6SWe4Ycg
STRIPE_GUARD_PRO_PRODUCT_ID=prod_TLbJ96d2ogmcNa
```

**Get real values from:** `/Users/maltewagenbach/Notes/Projects/KlyntosGuard/info.md`

### AI/LLM Keys
```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ANTHROPIC_API_KEY_HERE
```

**Get real value from:** `/Users/maltewagenbach/Notes/Projects/KlyntosGuard/info.md`

---

## 📋 One-Line Copy-Paste Format for Vercel CLI

If using Vercel CLI, you can set all variables at once:

```bash
vercel env add DATABASE_URL production
# Paste: postgresql://neondb_owner:npg_Jne76tCwaXON@ep-icy-rice-adyfyan5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

vercel env add BETTER_AUTH_SECRET production
# Paste: +b1P/m1g2q4ciqKo+NaKrKNFP8FJELiJXipO18yorBc=

vercel env add ENCRYPTION_KEY production
# Paste: b4a28a59f8c42f21855c269c1f4e92b0058d89976b82c59c9fd3dcee95784508

vercel env add BETTER_AUTH_URL production
# Paste: https://guard.klyntos.com

vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://guard.klyntos.com

vercel env add JWT_SECRET_KEY production
# Paste: your-jwt-secret-change-me-min-32-chars

vercel env add JWT_ALGORITHM production
# Paste: HS256

vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_YOUR_STRIPE_SECRET_KEY (from info.md)

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_YOUR_WEBHOOK_SECRET (from info.md)

vercel env add STRIPE_GUARD_BASIC_PRODUCT_ID production
# Paste: prod_TLbJkn6SWe4Ycg

vercel env add STRIPE_GUARD_PRO_PRODUCT_ID production
# Paste: prod_TLbJ96d2ogmcNa

vercel env add ANTHROPIC_API_KEY production
# Paste: sk-ant-api03-YOUR_ANTHROPIC_KEY (from info.md)
```

---

## ⚠️ Important Notes

### 1. Stripe Webhook Secret
The current `STRIPE_WEBHOOK_SECRET` is for **local development** (ngrok/localhost).

**For production, you MUST:**
1. Go to Stripe Dashboard → Webhooks
2. Create a NEW webhook endpoint: `https://guard.klyntos.com/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the NEW webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 2. Database Migrations
Before first deployment, run migrations:
```bash
# From web/ directory
npm run db:push
# Or manually via psql
psql $DATABASE_URL -f migrations/001_create_guard_api_keys.sql
psql $DATABASE_URL -f migrations/002_create_guard_subscriptions.sql
```

### 3. Custom Domain Setup
After deployment:
1. Go to Vercel Project Settings → Domains
2. Add domain: `guard.klyntos.com`
3. Add DNS records (provided by Vercel):
   - Type: `CNAME`
   - Name: `guard`
   - Value: `cname.vercel-dns.com`
4. Wait for SSL certificate (automatic)

### 4. Environment Variable Visibility
- `NEXT_PUBLIC_*` variables are exposed to the browser
- All other variables are server-side only
- Never expose secrets in `NEXT_PUBLIC_*` variables

---

## ✅ Deployment Checklist

- [ ] **Set all environment variables in Vercel**
- [ ] **Run database migrations**
- [ ] **Deploy from GitHub** (Vercel auto-deploys on push to main)
- [ ] **Add custom domain** `guard.klyntos.com`
- [ ] **Update Stripe webhook** for production URL
- [ ] **Test authentication flow**
- [ ] **Test API key generation**
- [ ] **Test scan endpoint** with Basic tier
- [ ] **Test scan endpoint** with Pro tier (if you have Pro subscription)
- [ ] **Verify usage tracking** (check database)
- [ ] **Test subscription checkout flow**

---

## 🚀 Quick Deploy Instructions

1. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import from GitHub: `https://github.com/0xShortx/KlyntosGuard`
   - Framework: Next.js
   - Root Directory: `web`

2. **Add Environment Variables:**
   - Copy all variables from above sections
   - Paste into Vercel Environment Variables section
   - Set for: Production, Preview, Development (or just Production)

3. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Vercel will give you a temporary URL (e.g., `klyntosguard.vercel.app`)

4. **Add Custom Domain:**
   - Project Settings → Domains
   - Add `guard.klyntos.com`
   - Update DNS as instructed by Vercel

5. **Update Stripe Webhook:**
   - Stripe Dashboard → Webhooks
   - Add endpoint: `https://guard.klyntos.com/api/webhooks/stripe`
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 🔍 Testing After Deployment

### 1. Test Landing Page
```bash
curl https://guard.klyntos.com
# Should return HTML with brutalism design
```

### 2. Test Documentation
```bash
curl https://guard.klyntos.com/docs/pro-features
# Should return Pro features documentation
```

### 3. Test Scan API (requires authentication)
```bash
# First generate API key via web UI
# Then test scan:
curl -X POST https://guard.klyntos.com/api/v1/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "api_key = \"sk-test-123\"",
    "language": "python",
    "filename": "test.py"
  }'
```

---

## 📊 Monitoring

After deployment, monitor:
- **Vercel Dashboard:** Build logs, deployment status
- **Vercel Analytics:** Page views, performance
- **Database:** Check scan history in `guard_scans` table
- **Stripe Dashboard:** Subscriptions, webhooks

---

## 🆘 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure `ROOT_DIRECTORY=web` is set
- Verify all environment variables are set

### 500 Errors
- Check Vercel Function Logs (Runtime Logs)
- Common issues:
  - Missing environment variables
  - Database connection issues
  - Invalid API keys

### Webhook Issues
- Verify webhook secret matches Stripe Dashboard
- Check webhook endpoint URL is correct
- Test webhook with Stripe CLI: `stripe trigger checkout.session.completed`

---

## 📝 Domain Strategy Decision

**✅ RECOMMENDED: guard.klyntos.com**

**Why:**
- Builds on existing Klyntos brand
- Shares authentication infrastructure
- Better SEO (links to main domain)
- Lower cost (no additional domain)
- Easier cross-selling

**Alternative:** alprina.com (NOT recommended)
- Requires building separate brand
- No existing brand equity
- Additional domain costs
- Separate infrastructure

---

**Status:** Ready to deploy to Vercel ✅
**GitHub:** Pushed to main branch
**Build:** Successful locally
**Next Step:** Import to Vercel and add environment variables
