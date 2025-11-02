/**
 * API Route: Exchange API Key for JWT Token
 * POST /api/cli/auth/exchange
 *
 * Exchanges a CLI API key for a JWT token that can be used for API requests.
 * This is the "bridge" authentication mechanism.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, guardApiKeys } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-jwt-secret-change-me-min-32-chars'
const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRES_IN = '7d' // 7 days

interface ExchangeRequest {
  apiKey: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ExchangeRequest = await request.json()
    const { apiKey } = body

    if (!apiKey || !apiKey.startsWith('kg_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Hash the provided API key
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')

    // Look up the API key in the database
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
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      )
    }

    // Check if key is expired
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'API key has expired' },
        { status: 401 }
      )
    }

    // Update last used timestamp
    await db
      .update(guardApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(guardApiKeys.id, keyRecord.id))

    // Generate JWT token
    const payload = {
      userId: keyRecord.userId,
      keyId: keyRecord.id,
      keyName: keyRecord.name,
    }

    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: JWT_EXPIRES_IN,
    })

    // Calculate expiration timestamp
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: keyRecord.userId,
        keyName: keyRecord.name,
      },
    })
  } catch (error) {
    console.error('Error exchanging API key:', error)
    return NextResponse.json(
      { error: 'Failed to exchange API key' },
      { status: 500 }
    )
  }
}
