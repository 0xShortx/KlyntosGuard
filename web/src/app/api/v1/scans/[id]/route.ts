/**
 * API Route: Get Scan Details
 * GET /api/v1/scans/[id]
 *
 * Returns detailed information about a specific scan including all vulnerabilities.
 * Used by CLI for `kg report show` command.
 * Supports both session-based auth (web) and API key auth (CLI).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, guardApiKeys, guardScans } from '@/lib/db'
import { guardVulnerabilities } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = authResult
    const scanId = params.id

    // Get scan details
    const [scan] = await db
      .select()
      .from(guardScans)
      .where(
        and(
          eq(guardScans.id, scanId),
          eq(guardScans.userId, userId)
        )
      )
      .limit(1)

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    // Get vulnerabilities
    const vulnerabilities = await db
      .select({
        id: guardVulnerabilities.id,
        severity: guardVulnerabilities.severity,
        category: guardVulnerabilities.category,
        message: guardVulnerabilities.message,
        line: guardVulnerabilities.line,
        column: guardVulnerabilities.column,
        codeSnippet: guardVulnerabilities.codeSnippet,
        suggestion: guardVulnerabilities.suggestion,
        cwe: guardVulnerabilities.cwe,
        createdAt: guardVulnerabilities.createdAt,
      })
      .from(guardVulnerabilities)
      .where(eq(guardVulnerabilities.scanId, scanId))
      .orderBy(guardVulnerabilities.line)

    // Calculate summary
    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      info: vulnerabilities.filter(v => v.severity === 'info').length,
    }

    return NextResponse.json({
      id: scan.id,
      fileName: scan.fileName,
      language: scan.language,
      policy: scan.policy,
      status: scan.status,
      vulnerabilityCount: scan.vulnerabilityCount,
      scanDurationMs: scan.scanDurationMs,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
      summary,
      vulnerabilities,
    })
  } catch (error) {
    console.error('Error fetching scan details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
