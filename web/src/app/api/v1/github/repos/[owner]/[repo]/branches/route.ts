import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGitHubAccessToken, getRepoBranches } from '@/lib/github'

/**
 * GET /api/v1/github/repos/:owner/:repo/branches
 * Get repository branches
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getGitHubAccessToken(session.user.id)

    const branches = await getRepoBranches(
      {
        owner: params.owner,
        repo: params.repo,
      },
      accessToken || undefined
    )

    return NextResponse.json({
      branches,
      count: branches.length,
    })
  } catch (error: any) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch branches',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
