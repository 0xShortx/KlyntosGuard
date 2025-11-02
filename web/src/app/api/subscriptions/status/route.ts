/**
 * Get Subscription Status
 * GET /api/subscriptions/status
 * Returns current user's subscription details
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guardSubscriptions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from session (Better Auth)
    // For now, using mock user
    const mockUserId = 'user_mock_123'

    // TODO: Replace with real session check:
    // const session = await getSession(request)
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const userId = session.user.id

    // Get user's active subscription
    const subscription = await db.query.guardSubscriptions.findFirst({
      where: eq(guardSubscriptions.userId, mockUserId),
      orderBy: [desc(guardSubscriptions.createdAt)],
    })

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        tier: null,
        status: null,
      })
    }

    // Calculate if subscription is active
    const isActive = ['active', 'trialing'].includes(subscription.status)
    const isPastDue = subscription.status === 'past_due'
    const isCanceled = subscription.status === 'canceled'

    // Check if trial is active
    const now = new Date()
    const isTrialing =
      subscription.status === 'trialing' &&
      subscription.trialEnd &&
      subscription.trialEnd > now

    // Calculate days until period end
    let daysUntilRenewal: number | null = null
    if (subscription.currentPeriodEnd) {
      const diff = subscription.currentPeriodEnd.getTime() - now.getTime()
      daysUntilRenewal = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      hasSubscription: true,
      tier: subscription.planTier,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      isActive,
      isPastDue,
      isCanceled,
      isTrialing,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      daysUntilRenewal,
      trialEnd: subscription.trialEnd,
      stripeCustomerId: subscription.stripeCustomerId,
    })
  } catch (error) {
    console.error('Subscription status error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to get subscription status', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
