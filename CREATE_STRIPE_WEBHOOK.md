# Create Stripe Webhook for KlyntosGuard

You need to add a webhook endpoint in Stripe Dashboard for Guard.

---

## 🎯 Quick Steps

### 1. Go to Stripe Dashboard → Webhooks

**URL:** https://dashboard.stripe.com/test/webhooks

(Or for live mode: https://dashboard.stripe.com/webhooks)

---

### 2. Click "Add endpoint"

---

### 3. Enter Endpoint URL

**For Development (ngrok required):**
```
https://YOUR_NGROK_URL.ngrok.io/api/webhooks/stripe
```

**For Production (Vercel):**
```
https://guard.klyntos.com/api/webhooks/stripe
```

**Note:** Since you're testing locally, you'll need ngrok or we can wait until you deploy to Vercel.

---

### 4. Select Events to Listen To

Check these 6 events:

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

---

### 5. Add Endpoint Description (Optional)

```
KlyntosGuard Subscription Webhooks
```

---

### 6. Click "Add endpoint"

---

### 7. Get Webhook Signing Secret

After creating the endpoint:

1. Click on the webhook you just created
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Add to `web/.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
   ```

---

## 🔄 Two Options for Local Testing

### Option A: Use Stripe CLI (Current Setup) ✅

**Pros:**
- Already set up and working
- No need for ngrok
- Automatic webhook forwarding

**Status:** Already running in your terminal

**Webhook Secret:**
```
whsec_e30037d10a2fde94d2e96d24bae876b39187c01420615b0ca41531f2d48bdf42
```

This is what we're using now for local testing.

---

### Option B: Use ngrok + Dashboard Webhook

**Pros:**
- Visible in Stripe Dashboard
- Exactly matches production setup

**Steps:**

1. **Install ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3001
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Create webhook in Stripe Dashboard:**
   - URL: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Select the 6 events listed above

5. **Copy signing secret** and update `.env.local`

6. **Restart web app** to use new secret

---

## 🚀 For Production (Vercel)

When you deploy to Vercel:

### 1. Deploy to Vercel

```bash
cd web
vercel --prod
```

This will give you: `https://guard.klyntos.com`

### 2. Create Production Webhook

Go to Stripe Dashboard (LIVE mode):

**URL:** https://dashboard.stripe.com/webhooks

1. Click "Add endpoint"
2. Enter: `https://guard.klyntos.com/api/webhooks/stripe`
3. Select the 6 events
4. Click "Add endpoint"
5. Copy the signing secret

### 3. Add to Vercel Environment Variables

```bash
vercel env add STRIPE_WEBHOOK_SECRET
```

Paste the production webhook secret when prompted.

---

## 🔍 Current Setup (Local Development)

**What's Running:**
- ✅ Stripe CLI listening (background process)
- ✅ Forwarding to: `localhost:3001/api/webhooks/stripe`
- ✅ Webhook secret configured in `.env.local`

**What You See in Dashboard:**
- Your main app webhook: `https://app.klyntos.com/api/auth/stripe/webhook`
- **No Guard webhook yet** (because we're using Stripe CLI for local testing)

**This is normal for development!**

---

## 📋 Recommended Approach

### Now (Local Testing)
Use Stripe CLI (already set up) ✅
- No dashboard webhook needed
- Works perfectly for development
- Test checkout will trigger webhooks

### Later (Production)
Create dashboard webhook when deploying to Vercel
- URL: `https://guard.klyntos.com/api/webhooks/stripe`
- Add production signing secret to Vercel env vars

---

## 🧪 Test Current Setup

Your Stripe CLI is already forwarding webhooks. To test:

1. **Visit:** http://localhost:3001/pricing

2. **Click "Subscribe Now"** for Guard Basic

3. **Use test card:** `4242 4242 4242 4242`

4. **Watch your terminal** where Stripe CLI is running

   You should see:
   ```
   --> checkout.session.completed
   --> customer.subscription.created
   --> invoice.payment_succeeded
   ```

5. **Check database:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM guard_subscriptions;"
   ```

The webhook is working even though you don't see it in Dashboard (because it's via CLI).

---

## ❓ FAQ

### Q: Why don't I see the Guard webhook in Stripe Dashboard?
**A:** Because we're using Stripe CLI for local development. The CLI forwards webhooks directly to your localhost without needing a dashboard entry.

### Q: Do I need to create a webhook in the dashboard now?
**A:** No, not for local testing. The Stripe CLI is handling it. You'll create the dashboard webhook when you deploy to production.

### Q: Will the webhooks work without a dashboard entry?
**A:** Yes! The Stripe CLI is forwarding webhooks to your local app right now.

### Q: When should I create the dashboard webhook?
**A:** When you deploy to Vercel and want production webhooks to work at `https://guard.klyntos.com`

---

## 🎯 Summary

**Current Setup (Local):**
- Stripe CLI ✅
- Webhooks forwarding ✅
- No dashboard entry needed ✅

**Production Setup (Later):**
- Deploy to Vercel
- Create webhook at `https://guard.klyntos.com/api/webhooks/stripe`
- Add signing secret to Vercel env vars

**You're good to test right now!** The webhook will work via Stripe CLI. 🚀
