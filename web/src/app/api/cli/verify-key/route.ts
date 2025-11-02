/**
 * API Route: Verify CLI API Key
 * POST /api/cli/verify-key
 *
 * Verifies an API key and returns a JWT token for CLI authentication.
 * This is the bridge between Better Auth (web) and JWT (CLI).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, guardApiKeys } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET_KEY!
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET_KEY environment variable is required')
}

export async function POST(request: NextRequest) {
  try {
    const { api_key: apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith('kg_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Hash the provided key
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')
    const prefix = apiKey.substring(0, 12)

    // Find matching key
    const keyRecord = await db.query.guardApiKeys.findFirst({
      where: and(
        eq(guardApiKeys.key, hashedKey),
        eq(guardApiKeys.prefix, prefix),
        eq(guardApiKeys.isActive, true)
      ),
    })

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Check expiration
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return NextResponse.json(
        { error: 'API key has expired' },
        { status: 401 }
      )
    }

    // Update last used timestamp
    await db.update(guardApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(guardApiKeys.id, keyRecord.id))

    // TODO: Fetch actual user from Better Auth users table
    // For now, return mock user data
    const mockUser = {
      id: keyRecord.userId,
      email: 'user@example.com', // TODO: Fetch from users table
      name: 'Test User', // TODO: Fetch from users table
    }

    // Generate JWT token (7 days expiry)
    const token = jwt.sign(
      {
        user_id: mockUser.id,
        email: mockUser.email,
        api_key_id: keyRecord.id,
      },
      JWT_SECRET,
      {
        algorithm: JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: '7d',
      }
    )

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 604800, // 7 days in seconds
      user: {
        id: mockUser.id,
        email: mockUser.email,
      },
    })
  } catch (error) {
    console.error('Error verifying API key:', error)
    return NextResponse.json(
      { error: 'Failed to verify API key' },
      { status: 500 }
    )
  }
}
