/**
 * API Route: Code Scanning with AI Analysis (UPDATED)
 * POST /api/v1/scan
 *
 * Analyzes code for security vulnerabilities, PII, secrets, and policy violations.
 * Uses Anthropic Claude for deep code analysis.
 *
 * UPDATED: Supports both JWT (legacy) and API key authentication
 * UPDATED: Saves complete scan results with vulnerabilities to database
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db, guardApiKeys, guardSubscriptions, guardScans } from '@/lib/db'
import { guardVulnerabilities } from '@/lib/db/schema'
import { eq, and, sql, gte } from 'drizzle-orm'
import { createHash } from 'crypto'
import { nanoid } from 'nanoid'

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-jwt-secret-change-me-min-32-chars'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface ScanRequest {
  code: string
  language?: string
  filename?: string
  policies?: string[]
  model?: 'haiku' | 'opus'
  depth?: 'standard' | 'deep'
}

interface Violation {
  line: number
  column?: number
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  message: string
  suggestion?: string
  code_snippet?: string
  cwe?: string
}

interface ScanResult {
  scan_id: string
  violations: Violation[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  scan_time_ms: number
}

/**
 * Authenticate request - supports both API key and JWT
 */
async function authenticateRequest(request: NextRequest): Promise<{ userId: string; apiKeyId?: string } | null> {
  const authHeader = headers().get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // Try API key authentication first (starts with kg_)
  if (token.startsWith('kg_')) {
    const hashedKey = createHash('sha256').update(token).digest('hex')

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

      return { userId: keyRecord.userId, apiKeyId: keyRecord.id }
    }
  } else {
    // Try JWT authentication
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return { userId: decoded.userId }
    } catch (error) {
      // Invalid JWT
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate request
    const authResult = await authenticateRequest(request)

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing authentication' },
        { status: 401 }
      )
    }

    const { userId, apiKeyId } = authResult

    // TODO: Re-enable subscription checks after migrating guardSubscriptions table to TEXT
    // For now, treat all users as having basic access (Haiku model, standard depth)
    const isPro = false
    const isBasic = true

    // Check user's subscription and usage (commented out until guardSubscriptions migration)
    // const [subscription] = await db
    //   .select()
    //   .from(guardSubscriptions)
    //   .where(eq(guardSubscriptions.userId, userId))
    //   .limit(1)
    //
    // const isPro = subscription?.planTier === 'pro'
    // const isBasic = subscription?.planTier === 'basic'

    // For Basic users: check monthly scan limit (disabled for testing)
    // if (isBasic) {
    //   const now = new Date()
    //   const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    //
    //   const result = await db
    //     .select({ count: sql<number>`count(*)::int` })
    //     .from(guardScans)
    //     .where(
    //       and(
    //         eq(guardScans.userId, userId),
    //         gte(guardScans.createdAt, firstDayOfMonth)
    //       )
    //     )
    //
    //   const monthlyScans = result[0]?.count || 0
    //
    //   if (monthlyScans >= 1000) {
    //     return NextResponse.json(
    //       {
    //         error: 'Monthly scan limit reached',
    //         message: 'You have reached the 1,000 scans/month limit for Basic plan. Upgrade to Pro for unlimited scans.',
    //         current_usage: monthlyScans,
    //         limit: 1000,
    //         upgrade_url: '/pricing',
    //       },
    //       { status: 429 }
    //     )
    //   }
    // }

    // Parse request body
    const body: ScanRequest = await request.json()
    const {
      code,
      language = 'unknown',
      filename = 'code.txt',
      policies = ['all'],
      model: requestedModel,
      depth: requestedDepth,
    } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (code.length > 50000) {
      return NextResponse.json(
        { error: 'Code is too long (max 50,000 characters)' },
        { status: 400 }
      )
    }

    // Determine model and depth based on subscription
    let modelToUse: string
    let depthToUse: 'standard' | 'deep'

    if (isPro) {
      modelToUse = requestedModel === 'opus' ? 'claude-3-opus-20240229' : 'claude-3-haiku-20240307'
      depthToUse = requestedDepth === 'deep' ? 'deep' : 'standard'
    } else {
      modelToUse = 'claude-3-haiku-20240307'
      depthToUse = 'standard'

      if (requestedModel === 'opus' || requestedDepth === 'deep') {
        console.log(`Basic user ${userId} attempted to use Pro features`)
      }
    }

    // Initialize Anthropic client
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    })

    // Create AI prompt for security analysis
    const prompt = createSecurityAnalysisPrompt(code, language, filename, policies, depthToUse, isPro)

    // Call Anthropic Claude
    const message = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: isPro && depthToUse === 'deep' ? 8192 : 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Parse AI response
    const aiResponse = message.content[0].type === 'text' ? message.content[0].text : ''
    const violations = parseViolations(aiResponse)

    // Calculate summary
    const summary = {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
      info: violations.filter(v => v.severity === 'info').length,
    }

    const scanDuration = Date.now() - startTime

    // Save scan to database
    const scanId = nanoid()
    const scanStatus = violations.length > 0 ? 'failed' : 'passed'

    try {
      // Insert scan record
      await db.insert(guardScans).values({
        id: scanId,
        userId: userId,
        fileName: filename,
        language: language,
        code: code,
        policy: isPro ? (depthToUse === 'deep' ? 'strict' : 'moderate') : 'moderate',
        status: scanStatus,
        vulnerabilityCount: violations.length,
        scanDurationMs: scanDuration,
        apiKeyId: apiKeyId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Insert vulnerabilities if any
      if (violations.length > 0) {
        await db.insert(guardVulnerabilities).values(
          violations.map(v => ({
            id: nanoid(),
            scanId: scanId,
            severity: v.severity,
            category: v.category,
            message: v.message,
            line: v.line,
            column: v.column || null,
            endLine: null,
            endColumn: null,
            codeSnippet: v.code_snippet || null,
            suggestion: v.suggestion || null,
            cwe: v.cwe || null,
            createdAt: new Date(),
          }))
        )
      }
    } catch (error) {
      console.error('Error saving scan to database:', error)
      // Don't fail the request if database save fails
    }

    const scanResult: ScanResult = {
      scan_id: scanId,
      violations,
      summary,
      scan_time_ms: scanDuration,
    }

    return NextResponse.json({
      success: true,
      result: scanResult,
      metadata: {
        language,
        filename,
        policies,
        lines_of_code: code.split('\n').length,
        model_used: modelToUse.includes('opus') ? 'opus' : 'haiku',
        analysis_depth: depthToUse,
        plan_tier: isPro ? 'pro' : 'basic',
      },
    })
  } catch (error: any) {
    console.error('Error scanning code:', error)

    return NextResponse.json(
      {
        error: 'Failed to scan code',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

function createSecurityAnalysisPrompt(
  code: string,
  language: string,
  filename: string,
  policies: string[],
  depth: 'standard' | 'deep',
  isPro: boolean
): string {
  const basePrompt = `You are a security analysis AI for KlyntosGuard, an enterprise code security platform.

Analyze the following ${language} code for security vulnerabilities and policy violations.

FILENAME: ${filename}
LANGUAGE: ${language}
POLICIES: ${policies.join(', ')}
ANALYSIS DEPTH: ${depth}${isPro ? ' (PRO)' : ' (BASIC)'}

CODE:
\`\`\`${language}
${code}
\`\`\``

  const standardAnalysis = `

Analyze for:
1. **Hardcoded Secrets**: API keys, passwords, tokens, credentials
2. **PII (Personal Identifiable Information)**: emails, SSNs, credit cards, phone numbers
3. **SQL Injection**: Unsafe SQL query construction
4. **XSS (Cross-Site Scripting)**: Unsafe HTML rendering
5. **Path Traversal**: Unsafe file path handling
6. **Command Injection**: Unsafe shell command execution
7. **Insecure Crypto**: Weak encryption, hardcoded keys
8. **Authentication Issues**: Missing auth, weak validation
9. **Authorization Issues**: Missing access control, privilege escalation
10. **Input Validation**: Missing or weak input sanitization`

  const deepAnalysis = `

DEEP ANALYSIS MODE - Perform comprehensive security review:

**Core Vulnerabilities:**
1. **Hardcoded Secrets**: API keys, passwords, tokens, credentials, private keys
2. **PII Exposure**: emails, SSNs, credit cards, phone numbers, addresses
3. **SQL Injection**: Unsafe queries, string concatenation, missing parameterization
4. **XSS**: Unsafe HTML rendering, missing sanitization, innerHTML usage
5. **Path Traversal**: Unsafe file operations, missing path validation
6. **Command Injection**: Unsafe shell execution, missing input sanitization
7. **Insecure Crypto**: Weak algorithms, hardcoded keys, improper IV usage
8. **Authentication**: Missing auth, weak validation, insecure token handling
9. **Authorization**: Missing access control, privilege escalation, IDOR
10. **Input Validation**: Missing sanitization, type coercion, injection vectors

**Advanced Analysis (Pro Features):**
11. **Dataflow Tracking**: Trace untrusted input from source to sink
12. **Cross-File Detection**: Identify vulnerabilities spanning multiple modules
13. **Business Logic Flaws**: Race conditions, TOCTOU, state management issues
14. **Dependency Risks**: Vulnerable imports, outdated packages
15. **Configuration Issues**: Insecure defaults, missing security headers
16. **Performance Impact**: DoS vectors, resource exhaustion, inefficient queries
17. **Privacy Concerns**: Data retention, logging sensitive info, GDPR compliance
18. **Cryptographic Weaknesses**: Key management, random number generation, entropy

For dataflow analysis, trace:
- Sources: User input, HTTP requests, file reads, environment variables
- Sinks: Database queries, shell commands, file operations, HTML output
- Sanitization: Validation, encoding, parameterization along the path`

  const outputFormat = `

For each violation found, provide:
- Line number (approximate if not exact)
- Severity: critical, high, medium, low, or info
- Category: secret, pii, sql-injection, xss, etc.
- Message: Brief description of the issue
- Suggestion: How to fix it${depth === 'deep' ? '\n- CWE: Common Weakness Enumeration ID if applicable (e.g., CWE-89)' : ''}

Format your response as JSON:
{
  "violations": [
    {
      "line": 10,
      "severity": "critical",
      "category": "hardcoded-secret",
      "message": "Hardcoded API key detected",
      "suggestion": "Move API key to environment variables",
      "code_snippet": "api_key = 'sk-1234...'"${depth === 'deep' ? ',\n      "cwe": "CWE-798"' : ''}
    }
  ]
}

If no violations are found, return:
{
  "violations": []
}

${depth === 'deep' ? 'Be extremely thorough. Analyze all potential attack vectors and edge cases.' : 'Be thorough but avoid false positives. Focus on real security issues.'}`

  return basePrompt + (depth === 'deep' ? deepAnalysis : standardAnalysis) + outputFormat
}

function parseViolations(aiResponse: string): Violation[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*"violations"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.violations || []
    }

    // Fallback: Look for JSON array
    const arrayMatch = aiResponse.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) {
        return parsed
      }
    }

    console.warn('Could not parse AI response as JSON:', aiResponse)
    return []
  } catch (error) {
    console.error('Error parsing violations:', error)
    console.error('AI Response:', aiResponse)
    return []
  }
}
