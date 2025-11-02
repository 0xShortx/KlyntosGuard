/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * Handles subscription lifecycle events from Stripe:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { verifyWebhookSignature, extractPlanTier, extractBillingCycle, mapStripeStatus } from '@/lib/stripe'
import { db } from '@/lib/db'
import { guardSubscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = verifyWebhookSignature(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`Received Stripe webhook: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed
 * Creates initial subscription record
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout session completed:', session.id)

  const userId = session.client_reference_id || session.metadata?.userId

  if (!userId) {
    console.error('No user ID found in checkout session')
    return
  }

  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  if (!subscriptionId) {
    console.error('No subscription ID in checkout session')
    return
  }

  // Get subscription tier from metadata
  const tier = (session.metadata?.productTier as 'basic' | 'pro') || 'basic'
  const productId = session.metadata?.stripeProductId || ''

  // Check if subscription record already exists
  const existing = await db.query.guardSubscriptions.findFirst({
    where: eq(guardSubscriptions.stripeSubscriptionId, subscriptionId),
  })

  if (existing) {
    console.log('Subscription already exists:', subscriptionId)
    return
  }

  // Create subscription record
  await db.insert(guardSubscriptions).values({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripeProductId: productId,
    planTier: tier,
    status: 'active', // Will be updated by subscription.created/updated webhook
  })

  console.log('Created subscription record for user:', userId)
}

/**
 * Handle customer.subscription.created/updated
 * Updates subscription details
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', subscription.id)

  // Find existing subscription record
  const existingRecord = await db.query.guardSubscriptions.findFirst({
    where: eq(guardSubscriptions.stripeSubscriptionId, subscription.id),
  })

  if (!existingRecord) {
    console.error('Subscription record not found:', subscription.id)

    // Try to get userId from metadata
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error('No user ID in subscription metadata')
      return
    }

    // Create new record
    const productId = subscription.items.data[0]?.price.product as string
    const priceId = subscription.items.data[0]?.price.id

    try {
      const tier = extractPlanTier(productId)
      const billingCycle = extractBillingCycle(priceId)

      await db.insert(guardSubscriptions).values({
        userId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripeProductId: productId,
        stripePriceId: priceId,
        planTier: tier,
        status: mapStripeStatus(subscription.status),
        billingCycle,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      })

      console.log('Created new subscription record from webhook')
    } catch (error) {
      console.error('Failed to create subscription from webhook:', error)
    }

    return
  }

  // Update existing record
  const productId = subscription.items.data[0]?.price.product as string
  const priceId = subscription.items.data[0]?.price.id

  try {
    const tier = extractPlanTier(productId)
    const billingCycle = extractBillingCycle(priceId)

    await db
      .update(guardSubscriptions)
      .set({
        stripeCustomerId: subscription.customer as string,
        stripeProductId: productId,
        stripePriceId: priceId,
        planTier: tier,
        status: mapStripeStatus(subscription.status),
        billingCycle,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(guardSubscriptions.stripeSubscriptionId, subscription.id))

    console.log('Updated subscription record:', subscription.id)
  } catch (error) {
    console.error('Failed to update subscription:', error)
  }
}

/**
 * Handle customer.subscription.deleted
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deletion:', subscription.id)

  await db
    .update(guardSubscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(guardSubscriptions.stripeSubscriptionId, subscription.id))

  console.log('Marked subscription as canceled:', subscription.id)
}

/**
 * Handle invoice.payment_succeeded
 * Updates subscription status to active
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Handling payment success:', invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log('Invoice not associated with subscription')
    return
  }

  // Update subscription status to active
  await db
    .update(guardSubscriptions)
    .set({
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(guardSubscriptions.stripeSubscriptionId, subscriptionId))

  console.log('Updated subscription to active after payment:', subscriptionId)
}

/**
 * Handle invoice.payment_failed
 * Updates subscription status to past_due
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling payment failure:', invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log('Invoice not associated with subscription')
    return
  }

  // Update subscription status to past_due
  await db
    .update(guardSubscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(guardSubscriptions.stripeSubscriptionId, subscriptionId))

  console.log('Updated subscription to past_due after payment failure:', subscriptionId)
}

// Disable body parsing for webhooks
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
