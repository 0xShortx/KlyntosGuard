import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/docs',
  '/docs/getting-started',
  '/docs/pro-features',
  '/api/auth',
  '/_next',
  '/favicon.ico',
]

// API routes that require authentication
const protectedApiPaths = [
  '/api/scan',
  '/api/usage',
  '/api/keys',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionToken = request.cookies.get('better-auth.session_token')

  // Redirect unauthenticated users to login
  if (!sessionToken) {
    // For API routes, return 401
    if (protectedApiPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // For page routes, redirect to login with callback
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
