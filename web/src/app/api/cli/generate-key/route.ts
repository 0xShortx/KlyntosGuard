/**
 * API Route: Generate CLI API Key
 * POST /api/cli/generate-key
 *
 * Generates a new API key for CLI authentication.
 * User must be authenticated via Better Auth session.
 */

import { NextRequest, NextResponse } from 'next/server'
// import { auth } from '@/lib/auth'  // TODO: Uncomment when Better Auth is set up
import { db, guardApiKeys } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    // TODO: Uncomment when Better Auth is configured
    // const session = await auth.api.getSession({ headers: request.headers })
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // For now, mock user ID (remove this when Better Auth is ready)
    const mockUserId = 'mock-user-id'
    // const userId = session.user.id  // Use this when Better Auth is ready

    const body = await request.json()
    const { name, expiresInDays } = body

    // Generate API key
    const rawKey = `kg_${randomBytes(32).toString('hex')}`
    const hashedKey = createHash('sha256').update(rawKey).digest('hex')
    const prefix = rawKey.substring(0, 12)

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // Save to database
    const [newKey] = await db.insert(guardApiKeys).values({
      id: nanoid(),
      userId: mockUserId, // Replace with session.user.id when ready
      name: name?.trim() || 'CLI Access',
      key: hashedKey,
      prefix,
      isActive: true,
      expiresAt,
    }).returning()

    return NextResponse.json({
      success: true,
      apiKey: rawKey, // ONLY TIME the plain key is returned!
      keyId: newKey.id,
      prefix: newKey.prefix,
      expiresAt: newKey.expiresAt,
      message: 'Save this API key - it will not be shown again!',
    })
  } catch (error) {
    console.error('Error generating API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}
