# Stripe Webhook Setup - Step by Step

Let's set up Stripe webhooks using Stripe CLI (preferred method).

---

## Step 1: Install Stripe CLI

### macOS (Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

### macOS (Manual Download)
```bash
# Download the latest release
curl -L https://github.com/stripe/stripe-cli/releases/latest/download/stripe_darwin_arm64.tar.gz -o stripe.tar.gz

# Extract
tar -xzf stripe.tar.gz

# Move to /usr/local/bin
sudo mv stripe /usr/local/bin/

# Verify installation
stripe --version
```

### Linux
```bash
# Download
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz

# Extract
tar -xzf stripe_linux_x86_64.tar.gz

# Move to path
sudo mv stripe /usr/local/bin/

# Verify
stripe --version
```

### Windows
Download from: https://github.com/stripe/stripe-cli/releases/latest

---

## Step 2: Login to Stripe

```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to allow access
3. Return to terminal with success message

**Output:**
```
Your pairing code is: word-word-word
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=...

✔ Done! The Stripe CLI is configured for Klyntos with account id acct_xxx
```

---

## Step 3: Start Webhook Forwarding

Open **Terminal 1** and run:

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

**Output:**
```
> Ready! You are using Stripe API Version [2024-11-20]. Your webhook signing secret is whsec_xxx (^C to quit)
```

**IMPORTANT:** Copy the webhook signing secret `whsec_xxx`

---

## Step 4: Update Environment Variables

Open **Terminal 2** and edit `.env.local`:

```bash
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
nano .env.local
```

Update this line with your webhook secret from Step 3:
```bash
STRIPE_WEBHOOK_SECRET="whsec_xxx_YOUR_SECRET_FROM_STEP_3"
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

---

## Step 5: Start Web App

In **Terminal 2**, start the web app:

```bash
npm run dev
```

**Output:**
```
▲ Next.js 15.0.3
- Local:        http://localhost:3001
- Ready in 1.2s
```

---

## Step 6: Test Webhook

In **Terminal 3**, trigger a test event:

```bash
stripe trigger checkout.session.completed
```

**Output in Terminal 1 (stripe listen):**
```
2025-11-02 12:34:56   --> checkout.session.completed [evt_xxx]
2025-11-02 12:34:56  <--  [200] POST http://localhost:3001/api/webhooks/stripe [evt_xxx]
```

**Output in Terminal 2 (web app):**
```
Received Stripe webhook: checkout.session.completed
Handling checkout session completed: cs_test_xxx
```

If you see `[200]` in Terminal 1, webhooks are working! ✅

---

## Step 7: Test Full Checkout Flow

1. Visit http://localhost:3001/pricing

2. Click "Subscribe Now" for Guard Basic

3. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`

4. Complete checkout

5. **Watch Terminal 1** for webhook events:
   ```
   --> checkout.session.completed
   --> customer.subscription.created
   --> invoice.payment_succeeded
   ```

6. Check database:
   ```bash
   psql "$DATABASE_URL" -c "SELECT id, plan_tier, status FROM guard_subscriptions;"
   ```

---

## Terminal Setup Summary

You'll have **3 terminals open**:

```
Terminal 1: Stripe CLI
└─ cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
   stripe listen --forward-to localhost:3001/api/webhooks/stripe

Terminal 2: Web App
└─ cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
   npm run dev

Terminal 3: Testing/Commands
└─ psql, stripe trigger, etc.
```

---

## Troubleshooting

### Webhook returns 401 or 400
- Check `STRIPE_WEBHOOK_SECRET` in `.env.local`
- Restart web app after updating `.env.local`

### Webhook not received
- Make sure `stripe listen` is running
- Check port 3001 is correct
- Verify endpoint URL: `localhost:3001/api/webhooks/stripe`

### Database not updating
- Check web app terminal for errors
- Verify migration was run: `npm run migrate`
- Check user ID in metadata (currently using mock)

---

## Quick Commands

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Start webhook forwarding (keep running)
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Test webhook (in another terminal)
stripe trigger checkout.session.completed

# View webhook events
stripe events list

# View specific event
stripe events retrieve evt_xxx

# View webhook logs
stripe listen --print-json
```

---

## What's Next?

After webhooks are working:

1. ✅ Stripe CLI installed
2. ✅ Logged in to Stripe
3. ✅ Webhook forwarding running
4. ✅ Web app running
5. ✅ Test checkout completed
6. ✅ Database updated

Then you can:
- Test different subscription scenarios
- Test cancellations
- Test payment failures
- Set up production webhook (on Vercel)

---

**Ready to start? Run these commands:** 👇

```bash
# Terminal 1
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Terminal 2 (after copying webhook secret to .env.local)
cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard/web
npm run dev

# Terminal 3 (test)
stripe trigger checkout.session.completed
```
