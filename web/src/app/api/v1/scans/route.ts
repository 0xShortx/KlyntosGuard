/**
 * API Route: List Scan History
 * GET /api/v1/scans
 *
 * Returns a paginated list of scans for the authenticated user.
 * Used by CLI for `kg report list` command.
 * Supports both session-based auth (web) and API key auth (CLI).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, guardApiKeys, guardScans } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // 'passed' | 'failed' | null (all)

    // Build query
    let query = db
      .select({
        id: guardScans.id,
        fileName: guardScans.fileName,
        language: guardScans.language,
        status: guardScans.status,
        vulnerabilityCount: guardScans.vulnerabilityCount,
        scanDurationMs: guardScans.scanDurationMs,
        policy: guardScans.policy,
        createdAt: guardScans.createdAt,
      })
      .from(guardScans)
      .where(
        status
          ? and(
              eq(guardScans.userId, userId),
              eq(guardScans.status, status)
            )
          : eq(guardScans.userId, userId)
      )
      .orderBy(desc(guardScans.createdAt))
      .limit(limit)
      .offset(offset)

    const scans = await query

    // Get total count
    const [totalResult] = await db
      .select({ count: db.$count(guardScans.id) })
      .from(guardScans)
      .where(
        status
          ? and(
              eq(guardScans.userId, userId),
              eq(guardScans.status, status)
            )
          : eq(guardScans.userId, userId)
      )

    return NextResponse.json({
      scans,
      pagination: {
        total: totalResult?.count || 0,
        limit,
        offset,
        has_more: (totalResult?.count || 0) > offset + scans.length,
      },
    })
  } catch (error) {
    console.error('Error fetching scans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
