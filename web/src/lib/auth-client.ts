import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001',
})

// Export commonly used functions for convenience
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  $Infer,
} = authClient

export type Session = typeof $Infer.Session
