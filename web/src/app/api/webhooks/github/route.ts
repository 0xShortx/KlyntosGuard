import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { guardGitHubRepositories, guardScans, account } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { processGitHubRepository } from '@/lib/github'
import { nanoid } from 'nanoid'

/**
 * Verify GitHub webhook signature
 * https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
 */
function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature) return false

  const sig = Buffer.from(signature.replace('sha256=', ''), 'hex')
  const hmac = createHmac('sha256', secret)
  const digest = Buffer.from(hmac.update(payload).digest('hex'), 'hex')

  if (sig.length !== digest.length) return false

  return timingSafeEqual(sig, digest)
}

/**
 * POST /api/webhooks/github
 * Handle GitHub webhook events (push, pull_request, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('GITHUB_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Get headers
    const signature = request.headers.get('x-hub-signature-256') || ''
    const event = request.headers.get('x-github-event') || ''
    const deliveryId = request.headers.get('x-github-delivery') || ''

    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify signature
    if (!verifyGitHubSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload
    const payload = JSON.parse(rawBody)

    console.log(`Received GitHub webhook: ${event} (${deliveryId})`)

    // Handle different event types
    switch (event) {
      case 'ping':
        return NextResponse.json({
          message: 'Pong! Webhook configured successfully',
          deliveryId,
        })

      case 'push':
        return await handlePushEvent(payload, deliveryId)

      case 'pull_request':
        return await handlePullRequestEvent(payload, deliveryId)

      default:
        console.log(`Unhandled event type: ${event}`)
        return NextResponse.json({
          message: `Event ${event} received but not handled`,
          deliveryId,
        })
    }
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Handle push events - auto-scan repository
 */
async function handlePushEvent(payload: any, deliveryId: string) {
  const {
    repository,
    ref,
    after: commitSha,
  } = payload

  const repoFullName = repository.full_name
  const branch = ref.replace('refs/heads/', '')
  const repoUrl = repository.html_url

  console.log(`Push event: ${repoFullName}:${branch} (${commitSha})`)

  try {
    // Check if this repository has auto-scan enabled
    const repoConfigs = await db
      .select()
      .from(guardGitHubRepositories)
      .where(
        and(
          eq(guardGitHubRepositories.fullName, repoFullName),
          eq(guardGitHubRepositories.autoScanEnabled, true)
        )
      )
      .limit(1)

    const repoConfig = repoConfigs[0]

    if (!repoConfig) {
      console.log(`Auto-scan not enabled for ${repoFullName}`)
      return NextResponse.json({
        message: 'Auto-scan not enabled for this repository',
        deliveryId,
      })
    }

    // Check if we should scan this branch
    if (
      repoConfig.autoscanBranches &&
      repoConfig.autoscanBranches.length > 0 &&
      !repoConfig.autoscanBranches.includes(branch)
    ) {
      console.log(`Branch ${branch} not in auto-scan list`)
      return NextResponse.json({
        message: `Branch ${branch} not configured for auto-scan`,
        deliveryId,
      })
    }

    // Create scan record
    const scanId = nanoid()
    await db.insert(guardScans).values({
      id: scanId,
      userId: repoConfig.userId,
      type: 'github',
      status: 'pending',
      githubUrl: repoUrl,
      branch: branch,
      commitSha: commitSha,
      triggeredBy: 'webhook',
      webhookDeliveryId: deliveryId,
    })

    // Trigger scan in background (don't wait for completion)
    processScanAsync(scanId, repoConfig.userId, repoUrl, branch, repoConfig.policy || 'moderate')
      .catch((error) => {
        console.error(`Background scan failed for ${scanId}:`, error)
      })

    return NextResponse.json({
      message: 'Scan triggered successfully',
      deliveryId,
      scanId: scanId,
      repository: repoFullName,
      branch,
      commitSha,
    })
  } catch (error: any) {
    console.error('Push event handling error:', error)
    throw error
  }
}

/**
 * Handle pull request events - scan PR changes and comment results
 */
async function handlePullRequestEvent(payload: any, deliveryId: string) {
  const {
    action,
    pull_request,
    repository,
  } = payload

  const repoFullName = repository.full_name
  const prNumber = pull_request.number
  const branch = pull_request.head.ref

  console.log(`PR event: ${action} on ${repoFullName}#${prNumber}`)

  // Only scan on opened, synchronize (new commits), and reopened
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return NextResponse.json({
      message: `PR action ${action} does not trigger scan`,
      deliveryId,
    })
  }

  try {
    // Check if this repository has PR scanning enabled
    const repoConfigs = await db
      .select()
      .from(guardGitHubRepositories)
      .where(
        and(
          eq(guardGitHubRepositories.fullName, repoFullName),
          eq(guardGitHubRepositories.prScanEnabled, true)
        )
      )
      .limit(1)

    const repoConfig = repoConfigs[0]

    if (!repoConfig) {
      console.log(`PR scan not enabled for ${repoFullName}`)
      return NextResponse.json({
        message: 'PR scan not enabled for this repository',
        deliveryId,
      })
    }

    // Create scan record
    const scanId = nanoid()
    await db.insert(guardScans).values({
      id: scanId,
      userId: repoConfig.userId,
      type: 'github',
      status: 'pending',
      githubUrl: repository.html_url,
      branch: branch,
      commitSha: pull_request.head.sha,
      triggeredBy: 'pr',
      webhookDeliveryId: deliveryId,
      prNumber: prNumber,
    })

    // Trigger scan in background and post comment when done
    processPRScanAsync(
      scanId,
      repoConfig.userId,
      repository.html_url,
      branch,
      repoConfig.policy || 'moderate',
      {
        owner: repository.owner.login,
        repo: repository.name,
        prNumber,
        action,
      }
    ).catch((error) => {
      console.error(`Background PR scan failed for ${scanId}:`, error)
    })

    return NextResponse.json({
      message: 'PR scan triggered successfully',
      deliveryId,
      scanId: scanId,
      repository: repoFullName,
      pullRequest: prNumber,
      action,
    })
  } catch (error: any) {
    console.error('PR event handling error:', error)
    throw error
  }
}

/**
 * Process scan asynchronously in background
 */
async function processScanAsync(
  scanId: string,
  userId: string,
  repoUrl: string,
  branch: string,
  policy: string
) {
  try {
    // Update scan status
    await db
      .update(guardScans)
      .set({ status: 'scanning' })
      .where(eq(guardScans.id, scanId))

    // Get user's GitHub access token
    const accounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'github')
        )
      )
      .limit(1)

    const githubAccount = accounts[0]

    // Process the repository
    const result = await processGitHubRepository(
      repoUrl,
      branch,
      policy,
      githubAccount?.accessToken || undefined
    )

    // Update scan with results
    await db
      .update(guardScans)
      .set({
        status: 'completed',
        results: JSON.stringify(result),
        completedAt: new Date(),
      })
      .where(eq(guardScans.id, scanId))

    console.log(`Scan ${scanId} completed successfully`)
  } catch (error: any) {
    console.error(`Scan ${scanId} failed:`, error)

    await db
      .update(guardScans)
      .set({
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      })
      .where(eq(guardScans.id, scanId))
  }
}

/**
 * Process PR scan and post comment with results
 */
async function processPRScanAsync(
  scanId: string,
  userId: string,
  repoUrl: string,
  branch: string,
  policy: string,
  prInfo: { owner: string; repo: string; prNumber: number; action: string }
) {
  try {
    // Update scan status
    await db
      .update(guardScans)
      .set({ status: 'scanning' })
      .where(eq(guardScans.id, scanId))

    // Get user's GitHub access token
    const accounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'github')
        )
      )
      .limit(1)

    const githubAccount = accounts[0]

    if (!githubAccount?.accessToken) {
      throw new Error('GitHub access token not found')
    }

    // Process the repository
    const result = await processGitHubRepository(
      repoUrl,
      branch,
      policy,
      githubAccount.accessToken
    )

    // Update scan with results
    await db
      .update(guardScans)
      .set({
        status: 'completed',
        results: JSON.stringify(result),
        completedAt: new Date(),
      })
      .where(eq(guardScans.id, scanId))

    // Post comment on PR with results
    await postPRComment(
      githubAccount.accessToken,
      prInfo.owner,
      prInfo.repo,
      prInfo.prNumber,
      result,
      scanId
    )

    console.log(`PR scan ${scanId} completed and comment posted`)
  } catch (error: any) {
    console.error(`PR scan ${scanId} failed:`, error)

    await db
      .update(guardScans)
      .set({
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      })
      .where(eq(guardScans.id, scanId))
  }
}

/**
 * Post scan results as PR comment
 */
async function postPRComment(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  results: any,
  scanId: string
) {
  const { Octokit } = await import('octokit')
  const octokit = new Octokit({ auth: accessToken })

  const { summary, violations, filesScanned, scanTime } = results

  // Build comment markdown
  const criticalCount = violations.filter((v: any) => v.severity === 'critical').length
  const highCount = violations.filter((v: any) => v.severity === 'high').length
  const mediumCount = violations.filter((v: any) => v.severity === 'medium').length
  const lowCount = violations.filter((v: any) => v.severity === 'low').length

  const emoji = criticalCount > 0 ? '🚨' : highCount > 0 ? '⚠️' : '✅'
  const status = violations.length === 0 ? 'passed' : criticalCount > 0 ? 'failed' : 'warning'

  const comment = `## ${emoji} Klyntos Guard Security Scan

**Status**: ${status === 'passed' ? '✅ Passed' : status === 'failed' ? '❌ Failed' : '⚠️ Warning'}
**Files Scanned**: ${filesScanned}
**Scan Time**: ${scanTime}

### Security Issues Found

${violations.length === 0 ? '✅ No security issues detected!' : ''}
${criticalCount > 0 ? `- 🚨 **Critical**: ${criticalCount}` : ''}
${highCount > 0 ? `- ⚠️ **High**: ${highCount}` : ''}
${mediumCount > 0 ? `- ⚡ **Medium**: ${mediumCount}` : ''}
${lowCount > 0 ? `- ℹ️ **Low**: ${lowCount}` : ''}

${violations.length > 0 ? `
### Top Issues

${violations.slice(0, 5).map((v: any, i: number) => `
${i + 1}. **${v.severity.toUpperCase()}**: ${v.type}
   - **File**: \`${v.file}:${v.line}\`
   - **Description**: ${v.message}
   ${v.suggestion ? `- **Fix**: ${v.suggestion}` : ''}
`).join('\n')}

${violations.length > 5 ? `\n_...and ${violations.length - 5} more issues_` : ''}
` : ''}

---
<sub>🛡️ Scan ID: \`${scanId}\` | Powered by [Klyntos Guard](https://guard.klyntos.com)</sub>
`

  // Check if we already commented on this PR
  const { data: existingComments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  })

  const botComment = existingComments.find(
    (comment) =>
      comment.user?.type === 'User' &&
      comment.body?.includes('Klyntos Guard Security Scan')
  )

  if (botComment) {
    // Update existing comment
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: botComment.id,
      body: comment,
    })
  } else {
    // Create new comment
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    })
  }
}
