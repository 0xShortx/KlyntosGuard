import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

// Force dynamic rendering for auth routes
export const dynamic = 'force-dynamic'

// Better Auth handler for Next.js App Router
// This handles all auth endpoints: /api/auth/*
export const { GET, POST } = toNextJsHandler(auth.handler)
