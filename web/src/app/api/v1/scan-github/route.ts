import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  parseGitHubUrl,
  getGitHubAccessToken,
  cloneRepository,
  getSourceFiles,
  cleanupTempDir,
  getRepositoryInfo,
  checkRepositoryAccess,
} from '@/lib/github'
import { db } from '@/lib/db'
import { scans, scanViolations } from '@/lib/db/schema'
import fs from 'fs/promises'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'

const scanRequestSchema = z.object({
  githubUrl: z.string().url(),
  branch: z.string().optional(),
  policy: z.enum(['strict', 'moderate', 'relaxed']).optional().default('moderate'),
})

/**
 * POST /api/v1/scan-github
 * Scan a GitHub repository
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers as any,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const { githubUrl, branch, policy } = scanRequestSchema.parse(body)

    // Parse GitHub URL
    const repoInfo = parseGitHubUrl(githubUrl)
    if (!repoInfo) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
        { status: 400 }
      )
    }

    if (branch) {
      repoInfo.branch = branch
    }

    // Get user's GitHub access token
    const accessToken = await getGitHubAccessToken(session.user.id)

    // Get repository info to verify access and get metadata
    let repoMetadata
    try {
      repoMetadata = await getRepositoryInfo(repoInfo, accessToken || undefined)

      // Use the actual default branch if no branch was specified
      if (!branch) {
        repoInfo.branch = repoMetadata.defaultBranch
      }

      // Check if private repo and user doesn't have access
      if (repoMetadata.isPrivate && !accessToken) {
        return NextResponse.json(
          {
            error: 'Private repository requires GitHub authentication',
            message: 'Please connect your GitHub account to scan private repositories',
          },
          { status: 403 }
        )
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Repository access failed',
          message: error.message || 'Could not access repository. It may be private or not exist.',
        },
        { status: 404 }
      )
    }

    // Clone repository to temporary directory
    let tmpDir: string
    try {
      tmpDir = await cloneRepository(repoInfo, accessToken || undefined)
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to clone repository',
          message: error.message,
        },
        { status: 500 }
      )
    }

    try {
      // Get all source files
      const sourceFiles = await getSourceFiles(tmpDir)

      if (sourceFiles.length === 0) {
        await cleanupTempDir(tmpDir)
        return NextResponse.json(
          {
            error: 'No source files found',
            message: 'Repository contains no scannable code files',
          },
          { status: 400 }
        )
      }

      // Limit file count (prevent abuse)
      const maxFiles = 500
      if (sourceFiles.length > maxFiles) {
        await cleanupTempDir(tmpDir)
        return NextResponse.json(
          {
            error: 'Repository too large',
            message: `Repository has ${sourceFiles.length} files. Maximum allowed: ${maxFiles}`,
          },
          { status: 400 }
        )
      }

      // Create scan record
      const [scan] = await db
        .insert(scans)
        .values({
          userId: session.user.id,
          source: `github:${repoMetadata.fullName}`,
          metadata: {
            githubUrl,
            branch: repoInfo.branch,
            repoName: repoMetadata.fullName,
            isPrivate: repoMetadata.isPrivate,
            language: repoMetadata.language,
            fileCount: sourceFiles.length,
          },
          status: 'pending',
        })
        .returning()

      // Scan files using Claude
      const violations: any[] = []
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      for (const filePath of sourceFiles) {
        try {
          const code = await fs.readFile(filePath, 'utf-8')
          const relativePath = path.relative(tmpDir, filePath)

          // Skip very large files (>100KB)
          if (code.length > 100000) {
            continue
          }

          // Scan with Claude
          const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            temperature: 0.1,
            messages: [
              {
                role: 'user',
                content: `You are a security code reviewer. Analyze this code for security vulnerabilities.

Policy: ${policy}

File: ${relativePath}
Language: ${path.extname(filePath).slice(1)}

Code:
\`\`\`
${code}
\`\`\`

Return ONLY a JSON array of vulnerabilities. Each object must have:
{
  "type": "SQL_INJECTION | XSS | HARDCODED_SECRET | etc",
  "severity": "critical | high | medium | low",
  "line": <line_number>,
  "description": "Brief description",
  "suggestion": "How to fix"
}

If no issues found, return empty array: []`,
              },
            ],
          })

          const content = response.content[0]
          if (content.type === 'text') {
            try {
              // Extract JSON from response
              const jsonMatch = content.text.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                const fileViolations = JSON.parse(jsonMatch[0])

                for (const violation of fileViolations) {
                  violations.push({
                    file: relativePath,
                    ...violation,
                  })
                }
              }
            } catch (parseError) {
              console.error('Error parsing Claude response:', parseError)
            }
          }
        } catch (fileError) {
          console.error(`Error scanning file ${filePath}:`, fileError)
        }
      }

      // Update scan with results
      await db
        .update(scans)
        .set({
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            ...scan.metadata,
            filesScanned: sourceFiles.length,
            violationsFound: violations.length,
          },
        })
        .where(db.eq(scans.id, scan.id))

      // Insert violations
      if (violations.length > 0) {
        await db.insert(scanViolations).values(
          violations.map((v) => ({
            scanId: scan.id,
            type: v.type,
            severity: v.severity,
            file: v.file,
            line: v.line,
            description: v.description,
            suggestion: v.suggestion,
          }))
        )
      }

      // Clean up temp directory
      await cleanupTempDir(tmpDir)

      return NextResponse.json({
        scanId: scan.id,
        repository: repoMetadata.fullName,
        branch: repoInfo.branch,
        filesScanned: sourceFiles.length,
        violations: violations.length,
        critical: violations.filter((v) => v.severity === 'critical').length,
        high: violations.filter((v) => v.severity === 'high').length,
        medium: violations.filter((v) => v.severity === 'medium').length,
        low: violations.filter((v) => v.severity === 'low').length,
        results: violations,
      })
    } catch (error) {
      // Clean up on error
      await cleanupTempDir(tmpDir)
      throw error
    }
  } catch (error: any) {
    console.error('Error scanning GitHub repository:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Failed to scan repository',
      },
      { status: 500 }
    )
  }
}
