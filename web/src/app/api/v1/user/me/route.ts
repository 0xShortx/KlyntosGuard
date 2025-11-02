/**
 * API Route: Get Current User Info
 * GET /api/v1/user/me
 *
 * Returns information about the currently authenticated user.
 * Used by CLI for `kg auth whoami` command.
 * Supports both session-based auth (web) and API key auth (CLI).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, guardApiKeys, guardScans } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { createHash } from 'crypto'
import { auth } from '@/lib/auth'

/**
 * Helper function to authenticate via API key or session
 */
async function authenticateRequest(request: NextRequest) {
  // Try API key authentication first (for CLI)
  const authHeader = request.headers.get('Authorization')

  if (authHeader?.startsWith('Bearer kg_')) {
    const apiKey = authHeader.substring(7)
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')

    const [keyRecord] = await db
      .select()
      .from(guardApiKeys)
      .where(
        and(
          eq(guardApiKeys.key, hashedKey),
          eq(guardApiKeys.isActive, true)
        )
      )
      .limit(1)

    if (keyRecord && (!keyRecord.expiresAt || new Date(keyRecord.expiresAt) > new Date())) {
      // Update last used
      await db
        .update(guardApiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(guardApiKeys.id, keyRecord.id))

      return { userId: keyRecord.userId, authMethod: 'api_key' }
    }
  }

  // Try session authentication (for web)
  const session = await auth.api.getSession({ headers: request.headers })
  if (session?.user) {
    return { userId: session.user.id, authMethod: 'session' }
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = authResult

    // Get user information
    const [userRecord] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get scan statistics for this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [scansThisMonth] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(guardScans)
      .where(
        and(
          eq(guardScans.userId, userId),
          gte(guardScans.createdAt, startOfMonth)
        )
      )

    // Get total scans
    const [totalScans] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(guardScans)
      .where(eq(guardScans.userId, userId))

    // Return user info with stats
    return NextResponse.json({
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      email_verified: userRecord.emailVerified,
      scans_this_month: scansThisMonth?.count || 0,
      total_scans: totalScans?.count || 0,
      created_at: userRecord.createdAt,
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
