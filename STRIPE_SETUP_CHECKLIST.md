# Stripe Setup Checklist

Quick checklist to get Stripe subscriptions running.

---

## ✅ Pre-Setup (Already Done)

- [x] Stripe products created:
  - Guard Basic: `prod_TLbJkn6SWe4Ycg`
  - Guard Pro: `prod_TLbJ96d2ogmcNa`
- [x] Database schema created (migrations/002)
- [x] Stripe SDK installed (`stripe@^17.5.0`)
- [x] API endpoints created
- [x] Webhook handler created
- [x] Pricing page created
- [x] CLI commands updated

---

## 🔧 Setup Steps (You Need to Do)

### 1. Create Stripe Prices (5 minutes)

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

**Guard Basic (`prod_TLbJkn6SWe4Ycg`):**
- [ ] Add monthly price: `$29/month`
  - Copy price ID: `price_________________`
- [ ] Add yearly price: `$290/year`
  - Copy price ID: `price_________________`

**Guard Pro (`prod_TLbJ96d2ogmcNa`):**
- [ ] Add monthly price: `$99/month`
  - Copy price ID: `price_________________`
- [ ] Add yearly price: `$990/year`
  - Copy price ID: `price_________________`

### 2. Get Stripe Keys (2 minutes)

Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)

- [ ] Copy **Publishable key** (test): `pk_test_________________`
- [ ] Copy **Secret key** (test): `sk_test_________________`

### 3. Update `.env.local` (2 minutes)

Edit `web/.env.local` and replace these values:

```bash
# Replace these with your actual keys from Step 2
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"

# Replace these with your price IDs from Step 1
STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID="price_YOUR_ID_HERE"
STRIPE_GUARD_BASIC_YEARLY_PRICE_ID="price_YOUR_ID_HERE"
STRIPE_GUARD_PRO_MONTHLY_PRICE_ID="price_YOUR_ID_HERE"
STRIPE_GUARD_PRO_YEARLY_PRICE_ID="price_YOUR_ID_HERE"
```

### 4. Run Database Migration (1 minute)

```bash
cd web
npm run migrate
```

Or manually:
```bash
psql "$DATABASE_URL" -f migrations/002_create_guard_subscriptions.sql
```

Verify tables were created:
```bash
psql "$DATABASE_URL" -c "\dt guard_*"
```

Expected output:
- `guard_api_keys`
- `guard_subscriptions`
- `guard_token_usage` (optional)
- `guard_scans` (optional)
- `guard_usage`

### 5. Set Up Webhook (Development) (5 minutes)

**Option A: Using ngrok (Recommended for testing)**

1. Install ngrok: https://ngrok.com/download
2. Start your web app:
   ```bash
   cd web
   npm run dev
   ```

3. In another terminal, start ngrok:
   ```bash
   ngrok http 3001
   ```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)

6. Click **"Add endpoint"**

7. Set endpoint URL: `https://abc123.ngrok.io/api/webhooks/stripe`

8. Select events:
   - [ ] `checkout.session.completed`
   - [ ] `customer.subscription.created`
   - [ ] `customer.subscription.updated`
   - [ ] `customer.subscription.deleted`
   - [ ] `invoice.payment_succeeded`
   - [ ] `invoice.payment_failed`

9. Click **"Add endpoint"**

10. Copy the **Signing secret** (starts with `whsec_`)

11. Update `.env.local`:
    ```bash
    STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
    ```

12. Restart your web app:
    ```bash
    cd web
    npm run dev
    ```

**Option B: Using Stripe CLI (Alternative)**

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```
4. Copy the webhook signing secret
5. Update `.env.local` with the secret
6. Keep the `stripe listen` command running

---

## 🧪 Testing (10 minutes)

### Test Checkout Flow

1. [ ] Start web app: `cd web && npm run dev`

2. [ ] Visit http://localhost:3001/pricing

3. [ ] Click "Subscribe Now" for **Guard Basic**

4. [ ] Use [Stripe test card](https://stripe.com/docs/testing):
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. [ ] Complete checkout

6. [ ] Verify redirect to `/subscriptions/success`

7. [ ] Check database for subscription:
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM guard_subscriptions;"
   ```

8. [ ] Test CLI:
   ```bash
   kg subscription current
   ```

9. [ ] Visit customer portal:
   ```bash
   # From /settings/subscription page (when created)
   ```

### Test Webhook Events

1. [ ] Check Stripe Dashboard → Webhooks → Logs
2. [ ] Verify events were received:
   - `checkout.session.completed`
   - `customer.subscription.created`
3. [ ] Check database was updated

### Test Different Scenarios

- [ ] Monthly subscription
- [ ] Yearly subscription
- [ ] Pro tier subscription
- [ ] Subscription cancellation
- [ ] Payment failure (use card `4000 0000 0000 0341`)

---

## 🚀 Production Setup (Later)

When ready for production:

1. [ ] Switch to Stripe Live mode
2. [ ] Get live API keys
3. [ ] Create live prices (or use same product IDs)
4. [ ] Set up webhook for production URL
5. [ ] Update production environment variables
6. [ ] Test with real card (then refund)
7. [ ] Configure tax collection (if needed)
8. [ ] Set up billing alerts

---

## 📊 Monitoring

### Stripe Dashboard
- **Customers:** https://dashboard.stripe.com/customers
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Events:** https://dashboard.stripe.com/events

### Database Queries

**Active subscriptions:**
```sql
SELECT * FROM guard_subscriptions WHERE status = 'active';
```

**Revenue by plan:**
```sql
SELECT plan_tier, COUNT(*) as subscribers
FROM guard_subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY plan_tier;
```

**Trial conversions:**
```sql
SELECT COUNT(*) as trial_users
FROM guard_subscriptions
WHERE status = 'trialing';
```

---

## 🆘 Troubleshooting

### Checkout button doesn't work
- Check browser console for errors
- Verify Stripe publishable key is set
- Check price IDs are correct in `.env.local`

### Webhook not received
- Check ngrok is running
- Verify webhook URL in Stripe Dashboard
- Check webhook signing secret is correct
- Look at Stripe Dashboard → Webhooks → Logs

### Database not updating
- Check webhook handler logs (terminal)
- Verify database connection
- Check user ID in metadata

### CLI can't fetch subscription
- Verify `KLYNTOS_GUARD_WEB_URL` env var
- Check web app is running
- Verify API endpoint `/api/subscriptions/status`

---

## ✅ Final Checklist

Before going live:

- [ ] All Stripe prices created
- [ ] All environment variables set
- [ ] Database migration run
- [ ] Webhook configured and tested
- [ ] Checkout flow tested
- [ ] CLI commands tested
- [ ] Customer portal tested
- [ ] Email receipts working (Stripe handles this)
- [ ] Tax collection configured (if needed)
- [ ] Terms of Service linked (in checkout)
- [ ] Privacy Policy linked (in checkout)

---

## 📚 Reference

- **Full Guide:** [STRIPE_INTEGRATION_GUIDE.md](STRIPE_INTEGRATION_GUIDE.md)
- **Stripe Docs:** https://stripe.com/docs
- **Test Cards:** https://stripe.com/docs/testing
- **Webhook Testing:** https://stripe.com/docs/webhooks/test

---

**Ready!** Once you complete the setup steps, your Stripe integration will be fully functional! 🎉
