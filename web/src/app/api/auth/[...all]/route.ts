import { auth } from '@/lib/auth'

// Better Auth handler for Next.js App Router
// This handles all auth endpoints: /api/auth/*
export async function GET(request: Request) {
  return auth.handler(request)
}

export async function POST(request: Request) {
  return auth.handler(request)
}
