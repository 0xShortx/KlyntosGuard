/**
 * Stripe Integration for KlyntosGuard
 * Handles subscription checkout and management
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

/**
 * Product and Price Configuration
 */
export const STRIPE_CONFIG = {
  products: {
    basic: process.env.STRIPE_GUARD_BASIC_PRODUCT_ID!,
    pro: process.env.STRIPE_GUARD_PRO_PRODUCT_ID!,
  },
  prices: {
    basic_monthly: process.env.STRIPE_GUARD_BASIC_MONTHLY_PRICE_ID!,
    basic_yearly: process.env.STRIPE_GUARD_BASIC_YEARLY_PRICE_ID!,
    pro_monthly: process.env.STRIPE_GUARD_PRO_MONTHLY_PRICE_ID!,
    pro_yearly: process.env.STRIPE_GUARD_PRO_YEARLY_PRICE_ID!,
  },
} as const

export type PlanTier = 'basic' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'

/**
 * Get price ID for a plan tier and billing cycle
 */
export function getPriceId(tier: PlanTier, cycle: BillingCycle): string {
  const key = `${tier}_${cycle}` as keyof typeof STRIPE_CONFIG.prices
  const priceId = STRIPE_CONFIG.prices[key]

  if (!priceId || priceId === 'price_xxx') {
    throw new Error(
      `Price ID not configured for ${tier} ${cycle}. Please set STRIPE_GUARD_${tier.toUpperCase()}_${cycle.toUpperCase()}_PRICE_ID in .env.local`
    )
  }

  return priceId
}

/**
 * Get product ID for a plan tier
 */
export function getProductId(tier: PlanTier): string {
  return STRIPE_CONFIG.products[tier]
}

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  tier,
  cycle,
  successUrl,
  cancelUrl,
}: {
  userId: string
  userEmail: string
  tier: PlanTier
  cycle: BillingCycle
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const priceId = getPriceId(tier, cycle)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      productId: 'guard',
      productTier: tier,
      stripeProductId: getProductId(tier),
    },
    subscription_data: {
      metadata: {
        userId,
        productId: 'guard',
        productTier: tier,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })

  return session
}

/**
 * Create a customer portal session for managing subscriptions
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Resume a subscription (undo cancel at period end)
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Cancel subscription immediately
 */
export async function cancelSubscriptionNow(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Helper to map Stripe subscription status to our status
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): string {
  // Map Stripe statuses to our internal statuses
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'active',
    past_due: 'past_due',
    unpaid: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    trialing: 'trialing',
    paused: 'paused',
  }

  return statusMap[stripeStatus] || stripeStatus
}

/**
 * Extract plan tier from Stripe product ID
 */
export function extractPlanTier(productId: string): PlanTier {
  if (productId === STRIPE_CONFIG.products.basic) {
    return 'basic'
  } else if (productId === STRIPE_CONFIG.products.pro) {
    return 'pro'
  }

  throw new Error(`Unknown product ID: ${productId}`)
}

/**
 * Extract billing cycle from price ID
 */
export function extractBillingCycle(priceId: string): BillingCycle {
  // Try to match against known price IDs
  if (
    priceId === STRIPE_CONFIG.prices.basic_monthly ||
    priceId === STRIPE_CONFIG.prices.pro_monthly
  ) {
    return 'monthly'
  } else if (
    priceId === STRIPE_CONFIG.prices.basic_yearly ||
    priceId === STRIPE_CONFIG.prices.pro_yearly
  ) {
    return 'yearly'
  }

  // Fallback: check if price has yearly interval
  // This would require fetching the price from Stripe API
  // For now, default to monthly
  return 'monthly'
}
