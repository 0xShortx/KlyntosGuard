/**
 * API Route: Manage CLI API Keys
 * GET /api/cli/keys - List user's API keys
 * DELETE /api/cli/keys - Revoke an API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, guardApiKeys } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

/**
 * GET - List all API keys for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user's API keys
    const keys = await db
      .select({
        id: guardApiKeys.id,
        prefix: guardApiKeys.prefix,
        name: guardApiKeys.name,
        isActive: guardApiKeys.isActive,
        createdAt: guardApiKeys.createdAt,
        lastUsedAt: guardApiKeys.lastUsedAt,
        expiresAt: guardApiKeys.expiresAt,
      })
      .from(guardApiKeys)
      .where(eq(guardApiKeys.userId, userId))
      .orderBy(desc(guardApiKeys.createdAt))

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const { keyId } = await request.json()

    if (!keyId) {
      return NextResponse.json(
        { error: 'keyId is required' },
        { status: 400 }
      )
    }

    // Revoke the key (set isActive to false)
    const [revokedKey] = await db
      .update(guardApiKeys)
      .set({ isActive: false })
      .where(
        and(
          eq(guardApiKeys.id, keyId),
          eq(guardApiKeys.userId, userId)
        )
      )
      .returning()

    if (!revokedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
