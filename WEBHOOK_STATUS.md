# ✅ Webhook Setup Complete!

## Status: Running

Your Stripe webhook forwarding is now active and configured.

---

## ✅ What's Done

1. ✅ **Stripe CLI installed** via Homebrew
2. ✅ **Logged in to Stripe** (account: `acct_1SE6Zh5ORcnuuJat`)
3. ✅ **Webhook secret generated** and added to `.env.local`
4. ✅ **Webhook listener running** (forwarding to `localhost:3001/api/webhooks/stripe`)

---

## 🔐 Webhook Secret

```bash
whsec_e30037d10a2fde94d2e96d24bae876b39187c01420615b0ca41531f2d48bdf42
```

This has been added to `web/.env.local` as `STRIPE_WEBHOOK_SECRET`.

---

## 🎯 Next Steps

### 1. Add Your Stripe Keys to `.env.local`

You still need to add your Stripe API keys. Edit `web/.env.local`:

```bash
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY"
```

### 2. Create Stripe Prices

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

For each product, click "Add pricing":

**Guard Basic (`prod_TLbJkn6SWe4Ycg`):**
- Monthly: `$29/month` → Copy price ID
- Yearly: `$290/year` → Copy price ID

**Guard Pro (`prod_TLbJ96d2ogmcNa`):**
- Monthly: `$99/month` → Copy price ID
- Yearly: `$990/year` → Copy price ID

Then add them to `.env.local`:
```bash
STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID="price_YOUR_ID"
STRIPE_GUARD_BASIC_YEARLY_PRICE_ID="price_YOUR_ID"
STRIPE_GUARD_PRO_MONTHLY_PRICE_ID="price_YOUR_ID"
STRIPE_GUARD_PRO_YEARLY_PRICE_ID="price_YOUR_ID"
```

### 3. Run Database Migration

```bash
cd web
npm run migrate
```

### 4. Start the Web App

```bash
cd web
npm run dev
```

### 5. Test the Flow

1. Visit http://localhost:3001/pricing
2. Click "Subscribe Now" for Guard Basic
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Watch for webhook events in your terminal

---

## 📡 Webhook Listener

The webhook listener is currently running in the background.

**To check status:**
```bash
ps aux | grep "stripe listen"
```

**To view webhook logs:**
The listener will show events in real-time when they occur.

**To manually trigger test events:**
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

---

## 🛠️ Managing the Webhook Listener

### Start Manually (if stopped)
```bash
cd web
./start-stripe-webhooks.sh
```

Or:
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

### Stop
Press `Ctrl+C` in the terminal running the listener.

---

## 🧪 Test Webhook Flow

1. **Start web app:**
   ```bash
   cd web && npm run dev
   ```

2. **Complete a test checkout** at http://localhost:3001/pricing

3. **Watch for events:**
   You should see in the Stripe listener terminal:
   ```
   --> checkout.session.completed
   --> customer.subscription.created
   --> invoice.payment_succeeded
   ```

4. **Check database:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM guard_subscriptions;"
   ```

---

## 📋 Checklist

- [x] Stripe CLI installed
- [x] Logged in to Stripe
- [x] Webhook secret generated
- [x] Webhook secret added to `.env.local`
- [x] Webhook listener running
- [ ] Stripe API keys added to `.env.local`
- [ ] Stripe prices created
- [ ] Price IDs added to `.env.local`
- [ ] Database migration run
- [ ] Web app running
- [ ] Test checkout completed

---

## 🆘 Troubleshooting

### Webhook returns 401 or 400
- Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches
- Restart web app after changing `.env.local`

### No webhook events received
- Check that `stripe listen` is running
- Verify web app is running on port 3001
- Check for errors in web app terminal

### Database not updating
- Verify migration was run: `npm run migrate`
- Check web app logs for errors
- Verify `DATABASE_URL` is correct

---

## 🎉 You're Ready!

Once you add your Stripe keys and create prices, you can start testing the full subscription flow!

**Next:** Add your Stripe keys to `.env.local` and create prices in Stripe Dashboard.
