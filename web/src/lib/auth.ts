import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin
  }

  // Server-side
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development
  return 'http://localhost:3001'
}

export const auth = betterAuth({
  baseURL: getBaseURL(),

  // Database configuration
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // Session configuration (optimized for web + CLI usage)
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    },
    expiresIn: 30 * 24 * 60 * 60, // 30 days (how long a session can last overall)
    updateAge: 24 * 60 * 60, // 24 hours (how often to refresh the expiry)
    freshAge: 60 * 60, // 1 hour
  },

  // CRITICAL: Enable cross-subdomain cookies
  // This allows users to be logged in across app.klyntos.com and guard.klyntos.com
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: '.klyntos.com', // Must start with dot!
    },
  },

  // Trusted origins (for CORS)
  trustedOrigins: [
    'http://localhost:3001',         // Guard local
    'https://guard.klyntos.com',     // Guard production
    'http://localhost:3000',         // Main app local
    'https://app.klyntos.com',       // Main app production
  ],

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We can enable this later
    sendResetPassword: async ({ user, url }) => {
      // TODO: Implement email sending
      console.log(`Password reset link for ${user.email}: ${url}`)
    },
  },

  // Social providers (GitHub & Google from main app)
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },

  // Account linking - allow same email with different providers
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github', 'email-password'],
    },
  },

  // Plugins
  plugins: [
    nextCookies(), // Required for Next.js cookie handling
  ],
})

// Export types
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
