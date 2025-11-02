/**
 * Create Stripe Checkout Session
 * POST /api/subscriptions/checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, type PlanTier, type BillingCycle } from '@/lib/stripe'
import { z } from 'zod'

// Request validation schema
const checkoutSchema = z.object({
  tier: z.enum(['basic', 'pro']),
  cycle: z.enum(['monthly', 'yearly']),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { tier, cycle } = checkoutSchema.parse(body)

    // TODO: Get user from session (Better Auth)
    // For now, using mock user
    const mockUserId = 'user_mock_123'
    const mockUserEmail = 'user@example.com'

    // TODO: Replace with real session check:
    // const session = await getSession(request)
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const userId = session.user.id
    // const userEmail = session.user.email

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

    // Create checkout session
    const session = await createCheckoutSession({
      userId: mockUserId,
      userEmail: mockUserEmail,
      tier: tier as PlanTier,
      cycle: cycle as BillingCycle,
      successUrl: `${appUrl}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
    })

    // Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Check for specific Stripe errors
      if (error.message.includes('Price ID not configured')) {
        return NextResponse.json(
          {
            error: 'Subscription plan not configured',
            message: error.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create checkout session', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
