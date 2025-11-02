/**
 * Create Stripe Customer Portal Session
 * POST /api/subscriptions/portal
 * Allows users to manage their subscription (cancel, update payment method, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe'
import { db } from '@/lib/db'
import { guardSubscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
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

    // Get user's subscription to find Stripe customer ID
    const subscription = await db.query.guardSubscriptions.findFirst({
      where: eq(guardSubscriptions.userId, mockUserId),
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

    // Create portal session
    const portalSession = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${appUrl}/settings/subscription`,
    })

    // Return portal URL
    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    console.error('Portal session error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to create portal session', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
