# Klyntos Guard - Authentication Setup Guide

## Overview

Klyntos Guard uses **shared authentication** with the main Klyntos platform. This means users can log in once and access both `app.klyntos.com` and `guard.klyntos.com` seamlessly.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Klyntos Ecosystem                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  app.klyntos.com        guard.klyntos.com           │
│  ┌────────────┐         ┌────────────┐             │
│  │            │         │            │             │
│  │  Main App  │◄───────►│   Guard    │             │
│  │            │         │    App     │             │
│  └────────────┘         └────────────┘             │
│         │                      │                    │
│         └──────────┬───────────┘                    │
│                    ▼                                │
│         ┌──────────────────────┐                   │
│         │   Shared Database    │                   │
│         │  (Better Auth)       │                   │
│         └──────────────────────┘                   │
│                                                      │
│  Session Cookie: .klyntos.com                       │
│  (Works across all subdomains)                      │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

From the main Klyntos app, you need:
1. Database connection string (`DATABASE_URL`)
2. Better Auth secret (`BETTER_AUTH_SECRET`)
3. Encryption key (`ENCRYPTION_KEY`)

## Step 1: Install Dependencies

```bash
npm install better-auth
npm install drizzle-orm @klyntos/db
```

## Step 2: Environment Variables

Create `.env.local` in your Guard project:

```bash
# Database (Same as main app)
DATABASE_URL="postgresql://user:password@host:5432/klyntos"

# Authentication (Same as main app)
BETTER_AUTH_SECRET="your_secret_key_from_main_app"
BETTER_AUTH_URL="https://guard.klyntos.com"  # Or http://localhost:3001 for local dev

# Security (Same as main app)
ENCRYPTION_KEY="your_encryption_key_from_main_app"

# App URL
NEXT_PUBLIC_APP_URL="https://guard.klyntos.com"  # Or http://localhost:3001
```

### How to Get These Values:

**Option 1: From Main App Developer**
Ask for these from `.env.local` or production environment variables.

**Option 2: Generate New (Development Only)**
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -hex 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

**⚠️ IMPORTANT:** For production, you MUST use the same values as the main app to share authentication!

## Step 3: Create Auth Configuration

Create `lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@klyntos/db'  // Shared database instance
import * as schema from '@klyntos/db/schema'

export const auth = betterAuth({
  // Base URL for this app
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',

  // Shared database with main app
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // 24 hours
    },
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    freshAge: 60 * 60, // 1 hour
  },

  // CRITICAL: Enable cross-subdomain cookies
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
      domain: '.klyntos.com', // Shares cookies across all *.klyntos.com
    },
  },

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Main app handles this
  },

  // Trusted origins
  trustedOrigins: [
    'http://localhost:3000',  // Main app (local)
    'http://localhost:3001',  // Guard app (local)
    'https://app.klyntos.com',
    'https://guard.klyntos.com',
  ],
})

// Export handlers for API routes
export const { GET, POST } = auth.handler
```

## Step 4: Create Auth Client

Create `lib/auth-client.ts`:

```typescript
import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
})

export const { signIn, signOut, signUp, useSession } = authClient
```

## Step 5: Auth API Routes

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { GET, POST } from '@/lib/auth'

export { GET, POST }
```

This creates all auth endpoints:
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`
- etc.

## Step 6: Middleware for Protected Routes

Create `middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const publicPaths = ['/login', '/signup', '/api/auth']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Step 7: Login Page

Create `app/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await signIn.email({
        email,
        password,
      })

      router.push('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Klyntos Guard</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="https://app.klyntos.com/signup" className="text-blue-600 hover:underline">
            Sign up on Klyntos
          </a>
        </p>
      </div>
    </div>
  )
}
```

## Step 8: Protected Page Example

Create `app/dashboard/page.tsx`:

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome to Guard</h1>
      <p className="mt-4">Logged in as: {session.user.email}</p>
      <p className="mt-2">User ID: {session.user.id}</p>
    </div>
  )
}
```

## Step 9: Client-Side Session Hook

Use in client components:

```typescript
'use client'

import { useSession } from '@/lib/auth-client'

export function UserProfile() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>

  if (!session) return <div>Not logged in</div>

  return (
    <div>
      <p>Welcome, {session.user.email}!</p>
    </div>
  )
}
```

## Local Development Setup

### Terminal 1: Main App
```bash
cd klyntos
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: Guard App
```bash
cd klyntos-guard
npm run dev -- -p 3001
# Runs on http://localhost:3001
```

### Testing Cross-Domain Auth (Local)

**Option 1: Use localhost subdomains (Recommended)**
Add to `/etc/hosts`:
```
127.0.0.1 app.local.klyntos.com
127.0.0.1 guard.local.klyntos.com
```

Then:
- Main app: `http://app.local.klyntos.com:3000`
- Guard app: `http://guard.local.klyntos.com:3001`

Update `.env.local`:
```bash
BETTER_AUTH_URL="http://guard.local.klyntos.com:3001"
NEXT_PUBLIC_APP_URL="http://guard.local.klyntos.com:3001"
```

**Option 2: Test on deployed environments**
Deploy to Vercel staging:
- Main: `app-staging.klyntos.com`
- Guard: `guard-staging.klyntos.com`

## Production Deployment

### Vercel Setup

1. **Create New Project** in Vercel
   - Import your Guard repository
   - Framework: Next.js

2. **Add Environment Variables**
   ```
   DATABASE_URL=[same as main app]
   BETTER_AUTH_SECRET=[same as main app]
   BETTER_AUTH_URL=https://guard.klyntos.com
   ENCRYPTION_KEY=[same as main app]
   NEXT_PUBLIC_APP_URL=https://guard.klyntos.com
   ```

3. **Add Custom Domain**
   - Go to Vercel project settings
   - Add domain: `guard.klyntos.com`
   - Follow DNS instructions

4. **DNS Configuration**
   In your domain registrar (e.g., Cloudflare, Namecheap):
   ```
   Type: CNAME
   Name: guard
   Value: cname.vercel-dns.com
   ```

## Testing the Integration

### Test 1: Login on Main App
1. Go to `https://app.klyntos.com`
2. Log in
3. Go to `https://guard.klyntos.com`
4. ✅ Should be automatically logged in

### Test 2: Login on Guard App
1. Go to `https://guard.klyntos.com`
2. Log in
3. Go to `https://app.klyntos.com`
4. ✅ Should be automatically logged in

### Test 3: Logout
1. Logout from either app
2. ✅ Should be logged out from both

## Troubleshooting

### Issue: Not staying logged in across domains

**Solution:** Check cookie domain setting
```typescript
// In lib/auth.ts, ensure:
advanced: {
  crossSubdomainCookies: {
    enabled: true,
    domain: '.klyntos.com', // Must start with a dot!
  },
}
```

### Issue: "CORS error" or "Trusted origins"

**Solution:** Add both domains to trustedOrigins
```typescript
trustedOrigins: [
  'https://app.klyntos.com',
  'https://guard.klyntos.com',
]
```

### Issue: Database connection failed

**Solution:** Ensure DATABASE_URL is accessible from Guard's hosting
- Check network rules
- Verify connection string
- Test with `psql` or database client

### Issue: Different users in each app

**Solution:** You're using different databases or secrets
- Must use SAME `DATABASE_URL`
- Must use SAME `BETTER_AUTH_SECRET`

## Security Considerations

1. **Same Database = Shared User Data**
   - Guard can access all user data from main app
   - Implement proper authorization/permissions in Guard

2. **Session Sharing**
   - Session is valid across all `*.klyntos.com` domains
   - Logout from one app = logout from all

3. **API Security**
   - Guard can make requests to main app's API using the session
   - Implement API-level authorization checks

4. **Secrets Management**
   - Store secrets in environment variables
   - Never commit `.env` files
   - Use Vercel's environment variables in production

## Summary

✅ **What You Get:**
- Single sign-on across `app.klyntos.com` and `guard.klyntos.com`
- Shared user database
- No duplicate accounts
- Seamless user experience

✅ **What You Need:**
- Same `DATABASE_URL`
- Same `BETTER_AUTH_SECRET`
- Same `ENCRYPTION_KEY`
- Cookie domain set to `.klyntos.com`

✅ **Development:**
- Main app on `:3000`, Guard on `:3001`
- Test with local subdomains or staging environments

✅ **Production:**
- Deploy Guard to Vercel
- Add `guard.klyntos.com` domain
- Copy environment variables from main app
- Done! 🚀

## Additional Resources

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Better Auth Cross-Subdomain Cookies](https://www.better-auth.com/docs/concepts/session-management#cross-subdomain-cookies)
- [Main Klyntos App Auth Implementation](../klyntos/lib/auth.ts)

## Questions?

If you have questions about the setup, check:
1. Main app's `apps/klyntos/lib/auth.ts` for reference implementation
2. Better Auth documentation
3. Ask the main app developer for the shared secrets

---

**Last Updated:** 2025-11-01
**Maintained By:** Klyntos Team
