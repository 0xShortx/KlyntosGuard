/**
 * API Route: Verify CLI API Key
 * POST /api/v1/auth/verify
 *
 * Verifies that an API key is valid and returns user information.
 * Used by CLI for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, guardApiKeys } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer kg_')) {
      return NextResponse.json(
        { valid: false, error: 'Invalid authorization header' },
        { status: 401 }
      )
    }

    // Extract the API key (remove 'Bearer ' prefix)
    const apiKey = authHeader.substring(7)

    // Hash the API key to compare with stored hash
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')

    // Find the API key in the database
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

    if (!keyRecord) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or revoked API key' },
        { status: 401 }
      )
    }

    // Check if key has expired
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'API key has expired' },
        { status: 401 }
      )
    }

    // Update last used timestamp
    await db
      .update(guardApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(guardApiKeys.id, keyRecord.id))

    // Get user information
    const [userRecord] = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, keyRecord.userId))
      .limit(1)

    if (!userRecord) {
      return NextResponse.json(
        { valid: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Return success with user info
    return NextResponse.json({
      valid: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
      },
    })
  } catch (error) {
    console.error('Error verifying API key:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
