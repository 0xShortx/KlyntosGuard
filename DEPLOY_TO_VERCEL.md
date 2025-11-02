# 🚀 Deploy KlyntosGuard to Vercel

**Status:** ✅ Ready to Deploy
**GitHub:** https://github.com/0xShortx/KlyntosGuard
**Framework:** Next.js (NOT FastAPI)
**Domain:** guard.klyntos.com

---

## ⚠️ IMPORTANT: Vercel Detected FastAPI?

**If Vercel shows "FastAPI" framework:**

This happens because there's a `requirements.txt` in the **root** of the repository (for the Python CLI).

### **Solution: Set Root Directory**

When importing to Vercel:
1. Import from GitHub: `0xShortx/KlyntosGuard`
2. **⚠️ CRITICAL:** Set **Root Directory** to `web`
3. Framework will auto-detect as **Next.js** ✅
4. Continue with deployment

**Screenshot guide:**
```
┌─────────────────────────────────────┐
│ Import Git Repository               │
├─────────────────────────────────────┤
│ Repository: KlyntosGuard            │
│ Framework Preset: Next.js           │ ← Should say Next.js
│ Root Directory: web                 │ ← MUST SET THIS!
│ Build Command: npm run build        │ ← Auto-filled
│ Output Directory: .next              │ ← Auto-filled
└─────────────────────────────────────┘
```

---

## 📋 Step-by-Step Deployment

### Step 1: Import to Vercel

1. Go to **https://vercel.com/new**
2. Click "Import Git Repository"
3. Select **GitHub** provider
4. Find repository: `0xShortx/KlyntosGuard`
5. Click "Import"

### Step 2: Configure Project

**CRITICAL SETTINGS:**

```
Project Name: klyntosguard (or klyntos-guard)
Framework: Next.js
Root Directory: web              ← MUST SET THIS!
Build Command: npm run build     ← Auto-detected
Output Directory: .next          ← Auto-detected
Install Command: npm install     ← Auto-detected
```

### Step 3: Add Environment Variables

Click "Environment Variables" and add these:

#### Required Variables (Copy from info.md)

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `DATABASE_URL` | `postgresql://...` | From info.md |
| `BETTER_AUTH_SECRET` | `+b1P/m1g2q4ciqKo+...` | From info.md |
| `ENCRYPTION_KEY` | `b4a28a59f8c42f21...` | From info.md |
| `BETTER_AUTH_URL` | `https://guard.klyntos.com` | Set this now |
| `NEXT_PUBLIC_APP_URL` | `https://guard.klyntos.com` | Set this now |
| `JWT_SECRET_KEY` | `your-jwt-secret-change-me-min-32-chars` | Set any 32+ char string |
| `JWT_ALGORITHM` | `HS256` | Set exactly this |
| `STRIPE_SECRET_KEY` | `sk_live_...` | From info.md |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From info.md (UPDATE AFTER!) |
| `STRIPE_GUARD_BASIC_PRODUCT_ID` | `prod_TLbJkn6SWe4Ycg` | Already correct |
| `STRIPE_GUARD_PRO_PRODUCT_ID` | `prod_TLbJ96d2ogmcNa` | Already correct |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | From info.md |

**Set for:** Production (and optionally Preview/Development)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. ✅ You'll get a URL like: `klyntosguard.vercel.app`

---

## 🌐 Add Custom Domain

### Step 1: Add Domain in Vercel

1. Go to Project Settings → **Domains**
2. Click "Add Domain"
3. Enter: `guard.klyntos.com`
4. Click "Add"

### Step 2: Configure DNS

Vercel will show you DNS records to add. Go to your domain registrar (likely Cloudflare or Namecheap):

**Add this DNS record:**
```
Type: CNAME
Name: guard
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
```

**Example for Cloudflare:**
```
guard.klyntos.com  →  CNAME  →  cname.vercel-dns.com
```

### Step 3: Wait for SSL

- Vercel automatically provisions SSL certificate
- Usually takes 1-5 minutes
- Status will change to "Valid" when ready

---

## ⚙️ Update Stripe Webhook (REQUIRED!)

The current `STRIPE_WEBHOOK_SECRET` is for **localhost only**. You MUST update it:

### Step 1: Create Production Webhook

1. Go to **Stripe Dashboard** → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://guard.klyntos.com/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click "Add endpoint"

### Step 2: Get New Webhook Secret

1. Click on the newly created webhook
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### Step 3: Update Vercel Environment Variable

1. Go to Vercel Project → Settings → Environment Variables
2. Find `STRIPE_WEBHOOK_SECRET`
3. Click "Edit"
4. Paste the NEW secret
5. Click "Save"
6. **Redeploy** (Vercel → Deployments → click "..." → Redeploy)

---

## ✅ Verify Deployment

### Test Landing Page
```bash
curl https://guard.klyntos.com
# Should return HTML with KlyntosGuard landing page
```

### Test Documentation
```bash
open https://guard.klyntos.com/docs/pro-features
# Should show Pro features documentation
```

### Test Authentication Flow
1. Go to `https://guard.klyntos.com/settings/cli`
2. Click "Generate New API Key"
3. Should create a key starting with `kg_`
4. Copy the key for CLI testing

### Test Scan API (requires key from above)
```bash
# First, exchange API key for JWT:
curl -X POST https://guard.klyntos.com/api/cli/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "kg_YOUR_API_KEY_HERE"}'

# Use the JWT token to test scan:
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

## 🐛 Troubleshooting

### "Build Failed" Error

**Check build logs:**
1. Vercel Dashboard → Deployments → Click failed deployment
2. Read build logs

**Common issues:**
- Missing environment variables → Add them
- Wrong root directory → Set to `web`
- Node version issue → Usually auto-fixed

### "500 Internal Server Error"

**Check runtime logs:**
1. Vercel Dashboard → Deployments → Click deployment → "View Function Logs"
2. Look for errors

**Common issues:**
- Missing environment variables
- Database connection failed
- Invalid API keys

### "Framework detected as FastAPI"

**Fix:**
1. Delete the project from Vercel
2. Re-import with **Root Directory: `web`**
3. Or add `vercel.json` (already in repo)

### Stripe Webhook Not Working

**Check:**
1. Webhook endpoint URL is correct: `https://guard.klyntos.com/api/webhooks/stripe`
2. Webhook secret is updated in Vercel
3. Events are selected in Stripe
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to https://guard.klyntos.com/api/webhooks/stripe
   stripe trigger checkout.session.completed
   ```

---

## 📊 Post-Deployment Checklist

- [ ] Site accessible at `guard.klyntos.com`
- [ ] Landing page loads with brutalism design
- [ ] Documentation pages load (`/docs/pro-features`)
- [ ] Can generate API key via UI
- [ ] Scan API works with authentication
- [ ] Stripe webhook updated for production URL
- [ ] SSL certificate active (https://)
- [ ] Database migrations run (check `guard_scans` table)
- [ ] Environment variables all set
- [ ] No errors in Vercel Function Logs

---

## 🔄 Continuous Deployment

**Auto-deploy on git push:**
- Every push to `main` branch triggers new deployment
- Vercel builds and deploys automatically
- Previous deployment stays live until new one succeeds
- Zero downtime deployments

**To disable auto-deploy:**
1. Project Settings → Git
2. Uncheck "Production Branch"

---

## 📈 Monitoring

### Vercel Dashboard
- **Analytics:** Page views, unique visitors
- **Speed Insights:** Performance metrics
- **Logs:** Runtime errors and function logs

### What to Monitor
- Build success rate
- Response times
- Error rates
- Scan API usage
- Database connection health

---

## 🆘 Need Help?

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Status: https://vercel-status.com
- Support: https://vercel.com/support

**KlyntosGuard Issues:**
- Check Vercel Function Logs
- Check database `guard_scans` table
- Test locally first: `npm run dev` in `web/` directory

---

**Status:** ✅ Ready to deploy
**Next Action:** Go to https://vercel.com/new and import the repository!
