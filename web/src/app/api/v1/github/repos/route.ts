import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGitHubAccessToken, listUserRepositories } from '@/lib/github'

/**
 * GET /api/v1/github/repos
 * List user's GitHub repositories
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getGitHubAccessToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'GitHub not connected',
          message: 'Please connect your GitHub account to access repositories',
        },
        { status: 403 }
      )
    }

    const repositories = await listUserRepositories(accessToken)

    return NextResponse.json({
      repositories,
      count: repositories.length,
    })
  } catch (error: any) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch repositories',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
