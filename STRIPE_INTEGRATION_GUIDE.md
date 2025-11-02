# Stripe Integration Guide - KlyntosGuard

Complete guide for setting up and managing Stripe subscriptions in KlyntosGuard.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Products Created](#products-created)
3. [Setup Instructions](#setup-instructions)
4. [Architecture](#architecture)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [CLI Integration](#cli-integration)
8. [Future: Token-Based Usage](#future-token-based-usage)

---

## Overview

KlyntosGuard uses **Stripe** for subscription management with two subscription tiers:

- **Guard Basic** - Essential security for individual developers
- **Guard Pro** - Advanced security for teams and organizations

### Current Model: Subscription-Based
Users subscribe monthly or yearly to access Guard features.

### Future Model: Token-Based (Planned)
Users can purchase token packages or get tokens with their subscription.

---

## Products Created

### 1. Guard Basic
- **Product ID:** `prod_TLbJkn6SWe4Ycg`
- **Pricing:**
  - Monthly: `$29/month` (you'll create price ID)
  - Yearly: `$290/year` (you'll create price ID)
- **Features:**
  - 1,000 code scans per month
  - Standard security policies
  - CLI access with API keys
  - Email support

### 2. Guard Pro
- **Product ID:** `prod_TLbJ96d2ogmcNa`
- **Pricing:**
  - Monthly: `$99/month` (you'll create price ID)
  - Yearly: `$990/year` (you'll create price ID)
- **Features:**
  - Unlimited code scans
  - Custom security policies
  - Real-time guardrails
  - Priority support (24/7)
  - API access
  - Compliance reports

---

## Setup Instructions

### Step 1: Create Stripe Prices

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. For each product (Basic and Pro), click **"Add pricing"**

**For Guard Basic (`prod_TLbJkn6SWe4Ycg`):**
- Monthly price: `$29.00/month` recurring
  - Copy the price ID (e.g., `price_xxx`)
- Yearly price: `$290.00/year` recurring
  - Copy the price ID (e.g., `price_xxx`)

**For Guard Pro (`prod_TLbJ96d2ogmcNa`):**
- Monthly price: `$99.00/month` recurring
  - Copy the price ID (e.g., `price_xxx`)
- Yearly price: `$990.00/year` recurring
  - Copy the price ID (e.g., `price_xxx`)

### Step 2: Update Environment Variables

Edit `web/.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY="sk_test_..."  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET="whsec_..."  # Get this after creating webhook
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # or pk_live_...

# Product IDs (already set)
STRIPE_GUARD_BASIC_PRODUCT_ID="prod_TLbJkn6SWe4Ycg"
STRIPE_GUARD_PRO_PRODUCT_ID="prod_TLbJ96d2ogmcNa"

# Price IDs (replace with your actual price IDs from Step 1)
STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID="price_xxx"
STRIPE_GUARD_BASIC_YEARLY_PRICE_ID="price_xxx"
STRIPE_GUARD_PRO_MONTHLY_PRICE_ID="price_xxx"
STRIPE_GUARD_PRO_YEARLY_PRICE_ID="price_xxx"
```

### Step 3: Run Database Migration

The subscription tables are already created if you ran the migration script:

```bash
cd web
npm run migrate  # or node scripts/run-migration.mjs
```

This creates:
- `guard_subscriptions` - Main subscription data
- `guard_token_usage` - For future token-based billing (optional)
- `guard_scans` - Scan history (optional)

Or run migration 002 separately:

```bash
psql "$DATABASE_URL" -f migrations/002_create_guard_subscriptions.sql
```

### Step 4: Set Up Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Set endpoint URL:
   - **Development:** `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
   - **Production:** `https://guard.klyntos.com/api/webhooks/stripe`

4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 5: Install Dependencies

```bash
cd web
npm install
```

This installs:
- `stripe@^17.5.0` - Stripe SDK

### Step 6: Test the Setup

```bash
cd web
npm run dev
```

Visit:
- http://localhost:3001/pricing - View pricing page
- http://localhost:3001/settings/cli - Generate API keys

---

## Architecture

### Web Application Flow

```
┌──────────────────────────────────────────────────────┐
│              Subscription Flow                        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. User visits /pricing                             │
│     ├─ Selects plan (Basic/Pro)                      │
│     ├─ Selects billing cycle (Monthly/Yearly)        │
│     └─ Clicks "Subscribe Now"                        │
│                                                       │
│  2. POST /api/subscriptions/checkout                 │
│     ├─ Creates Stripe checkout session               │
│     ├─ Includes user metadata                        │
│     └─ Returns checkout URL                          │
│                                                       │
│  3. User completes checkout on Stripe                │
│                                                       │
│  4. Stripe webhook: checkout.session.completed       │
│     POST /api/webhooks/stripe                        │
│     ├─ Verifies webhook signature                    │
│     ├─ Creates guard_subscriptions record            │
│     └─ Returns 200 OK                                │
│                                                       │
│  5. Stripe webhook: customer.subscription.created    │
│     ├─ Updates subscription details                  │
│     ├─ Sets plan tier, billing cycle                 │
│     └─ Sets period start/end dates                   │
│                                                       │
│  6. User redirected to /subscriptions/success        │
│     ├─ Shows subscription confirmation               │
│     ├─ Shows next steps (generate API key)           │
│     └─ Link to generate CLI key                      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Database Schema

**guard_subscriptions:**
```sql
- id (UUID, primary key)
- user_id (UUID, references users)
- stripe_customer_id (VARCHAR)
- stripe_subscription_id (VARCHAR, unique)
- stripe_price_id (VARCHAR)
- stripe_product_id (VARCHAR)
- plan_tier (VARCHAR) -- 'basic', 'pro'
- status (VARCHAR) -- 'active', 'canceled', 'past_due', 'trialing'
- billing_cycle (VARCHAR) -- 'monthly', 'yearly'
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- cancel_at_period_end (BOOLEAN)
- canceled_at (TIMESTAMP)
- trial_start (TIMESTAMP)
- trial_end (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### API Endpoints

**Checkout:**
- `POST /api/subscriptions/checkout` - Create checkout session
  - Body: `{ tier: 'basic' | 'pro', cycle: 'monthly' | 'yearly' }`
  - Returns: `{ url: string, sessionId: string }`

**Status:**
- `GET /api/subscriptions/status` - Get current subscription
  - Returns: Subscription details

**Portal:**
- `POST /api/subscriptions/portal` - Create customer portal session
  - Returns: `{ url: string }`

**Webhook:**
- `POST /api/webhooks/stripe` - Handle Stripe events
  - Verifies signature
  - Processes events
  - Updates database

---

## Testing

### Test Mode

1. Use Stripe test keys:
   ```bash
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

2. Use [Stripe test cards](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

3. Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to test webhooks:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   stripe trigger checkout.session.completed
   ```

### Test Checklist

- [ ] Visit /pricing page
- [ ] Click "Subscribe Now" for Basic plan
- [ ] Complete checkout with test card
- [ ] Verify redirect to /subscriptions/success
- [ ] Check database for subscription record
- [ ] Run `kg subscription current` in CLI
- [ ] Test subscription status API
- [ ] Test customer portal
- [ ] Test webhook events with Stripe CLI

---

## Production Deployment

### Stripe Configuration

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get Live Keys:**
   - Secret key: `sk_live_...`
   - Publishable key: `pk_live_...`
3. **Update Product Prices** (if different from test)
4. **Configure Webhooks:**
   - Add production URL: `https://guard.klyntos.com/api/webhooks/stripe`
   - Get signing secret: `whsec_...`

### Environment Variables (Production)

```bash
# Stripe Live Keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Product/Price IDs (same as test if using same products)
STRIPE_GUARD_BASIC_PRODUCT_ID="prod_TLbJkn6SWe4Ycg"
STRIPE_GUARD_PRO_PRODUCT_ID="prod_TLbJ96d2ogmcNa"
STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID="price_live_xxx"
STRIPE_GUARD_BASIC_YEARLY_PRICE_ID="price_live_xxx"
STRIPE_GUARD_PRO_MONTHLY_PRICE_ID="price_live_xxx"
STRIPE_GUARD_PRO_YEARLY_PRICE_ID="price_live_xxx"
```

### Vercel Deployment

```bash
# Set environment variables in Vercel dashboard
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Deploy
vercel --prod
```

### Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Webhook endpoint configured in Stripe
- [ ] Test live checkout flow
- [ ] Monitor webhook events in Stripe Dashboard
- [ ] Set up Stripe email notifications
- [ ] Configure tax collection (if needed)
- [ ] Review Stripe security settings

---

## CLI Integration

The CLI can now check subscription status and open upgrade pages.

### Commands

**Check subscription:**
```bash
kg subscription current
```

Output:
```
╭─ Current Subscription ─────────────────────────────────╮
│ Plan:         Guard Pro                                │
│ Status:       Active                                   │
│ Billing:      Monthly                                  │
│ Next billing: Dec 15, 2025 (23 days)                   │
╰────────────────────────────────────────────────────────╯

Manage subscription: http://localhost:3001/settings/subscription
```

**Upgrade subscription:**
```bash
kg subscription upgrade
```

Opens pricing page in browser.

**View available plans:**
```bash
kg subscription plans
```

### Environment Variable

Set web UI URL for CLI:
```bash
export KLYNTOS_GUARD_WEB_URL="https://guard.klyntos.com"
```

Or in `~/.bashrc` / `~/.zshrc`:
```bash
echo 'export KLYNTOS_GUARD_WEB_URL="https://guard.klyntos.com"' >> ~/.zshrc
```

---

## Future: Token-Based Usage

### Planned Features

**Token Packages:**
- 100 tokens: `$10`
- 500 tokens: `$45` (10% off)
- 1000 tokens: `$80` (20% off)
- 5000 tokens: `$350` (30% off)

**Token Consumption:**
- Basic scan: 1 token
- Advanced scan: 5 tokens
- Custom policy scan: 10 tokens

**Hybrid Model:**
- Subscription includes tokens
- Purchase additional tokens as needed
- Tokens roll over (configurable)

### Database Schema (Already Created)

The `guard_token_usage` table is ready for token-based billing:

```sql
- tokens_total (INTEGER)
- tokens_used (INTEGER)
- tokens_remaining (INTEGER)
- scans_this_month (INTEGER)
- last_reset_at (TIMESTAMP)
```

### Implementation Steps (Future)

1. Create token package products in Stripe
2. Create one-time payment prices
3. Add token purchase endpoint
4. Implement token deduction on scan
5. Add token balance API endpoint
6. Update CLI to show token balance
7. Add usage analytics dashboard

---

## Support & Resources

### Documentation
- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

### Help
- **Stripe Issues:** [Stripe Support](https://support.stripe.com)
- **Guard Issues:** support@klyntos.com
- **GitHub:** [KlyntosGuard Issues](https://github.com/0xShortx/KlyntosGuard/issues)

### Monitoring
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Webhook Logs:** https://dashboard.stripe.com/webhooks
- **Customer Portal:** Enabled for all customers

---

## Quick Reference

### Environment Variables Checklist
```bash
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ STRIPE_GUARD_BASIC_PRODUCT_ID
✅ STRIPE_GUARD_PRO_PRODUCT_ID
✅ STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID
✅ STRIPE_GUARD_BASIC_YEARLY_PRICE_ID
✅ STRIPE_GUARD_PRO_MONTHLY_PRICE_ID
✅ STRIPE_GUARD_PRO_YEARLY_PRICE_ID
```

### Files Created
```
web/
├── src/
│   ├── lib/stripe.ts                       # Stripe utilities
│   ├── lib/db/schema.ts                    # Updated with subscriptions
│   ├── app/
│   │   ├── pricing/page.tsx                # Pricing page
│   │   ├── subscriptions/success/page.tsx  # Success page
│   │   └── api/
│   │       ├── subscriptions/
│   │       │   ├── checkout/route.ts       # Create checkout
│   │       │   ├── status/route.ts         # Get status
│   │       │   └── portal/route.ts         # Customer portal
│   │       └── webhooks/
│   │           └── stripe/route.ts         # Webhook handler
│   └── migrations/
│       └── 002_create_guard_subscriptions.sql

src/klyntos_guard/cli/
└── enhanced_cli.py                         # Updated subscription commands
```

---

**Last Updated:** 2025-11-02
**Status:** Ready for testing with Stripe test mode
