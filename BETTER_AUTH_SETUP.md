# Better Auth Setup Complete! 🎉

## ✅ What's Been Configured

### 1. Database Tables Created
- ✅ `user` - User accounts
- ✅ `session` - Active sessions
- ✅ `account` - OAuth provider accounts (GitHub, Google)
- ✅ `verification` - Email verification tokens

### 2. Auth Pages Created
- ✅ `/login` - Sign in page with email/password and social login
- ✅ `/signup` - Create account page
- Both pages use **brutalism design** matching your brand!

### 3. API Routes
- ✅ `/api/auth/*` - All Better Auth endpoints

### 4. Configuration Files
- ✅ `src/lib/auth.ts` - Server-side auth configuration
- ✅ `src/lib/auth-client.ts` - Client-side auth hooks
- ✅ `src/lib/db/schema.ts` - Updated with auth tables

---

## 🔑 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET="ioosKpwRs8Vn4xD96ESt8tp6hCwpUje2IatCoNk0/8Q="
BETTER_AUTH_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# GitHub OAuth (Optional - for "Sign in with GitHub")
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"

# Google OAuth (Optional - for "Sign in with Google")
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
```

---

## 🚀 How to Get OAuth Credentials

### GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Klyntos Guard Dev
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret**

**For Production:**
- Create another OAuth app with production URLs:
  - Homepage: `https://guard.klyntos.com`
  - Callback: `https://guard.klyntos.com/api/auth/callback/github`

---

### Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth Client ID"
5. Configure consent screen if needed
6. Choose "Web application"
7. Add **Authorized redirect URIs**:
   - `http://localhost:3001/api/auth/callback/google`
   - `https://guard.klyntos.com/api/auth/callback/google` (for production)
8. Copy the **Client ID** and **Client Secret**

---

## 🎯 Features Enabled

### Email/Password Authentication
- ✅ Sign up with email + password
- ✅ Sign in with email + password
- ✅ Password visibility toggle
- ✅ Form validation
- ✅ Error handling

### Social Login (if credentials provided)
- ✅ Sign in with GitHub
- ✅ Sign in with Google
- ✅ Account linking (same email, different providers)

### Session Management
- ✅ 30-day session expiry
- ✅ 24-hour refresh window
- ✅ Cross-subdomain cookies (shares auth with main Klyntos app)
- ✅ Secure cookie handling

---

## 🧪 Testing the Authentication

### 1. Start the dev server
```bash
cd web
npm run dev
```

### 2. Test Sign Up
1. Visit http://localhost:3001/signup
2. Fill in name, email, password
3. Click "Create Account"
4. Should redirect to `/welcome`

### 3. Test Sign In
1. Visit http://localhost:3001/login
2. Enter email and password
3. Click "Sign In"
4. Should redirect to `/dashboard`

### 4. Test Social Login (if configured)
1. Click "Continue with GitHub" or "Continue with Google"
2. Authorize the app
3. Should redirect back and create/login user

---

## 🔒 Security Features

### Password Hashing
- ✅ Passwords are hashed with bcrypt (automatic via Better Auth)
- ✅ Never stored in plaintext

### Session Security
- ✅ HTTP-only cookies
- ✅ Secure cookies in production
- ✅ SameSite: Lax
- ✅ Token rotation

### CSRF Protection
- ✅ Built into Better Auth
- ✅ Origin validation

---

## 📱 Cross-Subdomain Authentication

Your auth is configured to work across:
- `app.klyntos.com` (main platform)
- `guard.klyntos.com` (this app)

**How it works:**
- Cookie domain is set to `.klyntos.com`
- User logs in on Guard → automatically logged in on main app
- User logs in on main app → automatically logged in on Guard

**Trusted origins configured:**
- `http://localhost:3001` (Guard local)
- `https://guard.klyntos.com` (Guard production)
- `http://localhost:3000` (Main app local)
- `https://app.klyntos.com` (Main app production)

---

## 🎨 Brutalism Design Elements

Both login and signup pages feature:
- **Bold 4px borders** everywhere
- **Black & white** primary colors with **blue-600** accents
- **Font-black typography** (900 weight)
- **All caps headings** and labels
- **Sharp edges** - no rounded corners
- **High contrast** for accessibility
- **Google/GitHub logos** integrated with brutalism style

---

## 🔄 Next Steps

### 1. Update Homepage Navigation
Update `/src/app/page.tsx` to link to `/login` and `/signup`:

```tsx
<Link href="/login">Sign In</Link>
<Link href="/signup">Get Started</Link>
```

### 2. Add Middleware (Route Protection)
Create `middleware.ts` to protect routes:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/signup', '/api/auth', '/_next', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = request.cookies.get('better-auth.session_token')

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. Update Dashboard to Use Real Session
Update `/src/app/dashboard/page.tsx`:

```tsx
import { useSession } from '@/lib/auth-client'

export default function DashboardPage() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>

  return (
    <div>
      <h1>Welcome, {session?.user?.name}!</h1>
      {/* ... rest of dashboard */}
    </div>
  )
}
```

### 4. Add Sign Out Button
```tsx
import { authClient } from '@/lib/auth-client'

<Button onClick={() => authClient.signOut()}>
  Sign Out
</Button>
```

---

## 📊 Database Schema

### User Table
```sql
CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN DEFAULT false,
  "image" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Session Table
```sql
CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY,
  "expires_at" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "user_id" TEXT REFERENCES "user"("id") ON DELETE CASCADE,
  ...
);
```

---

## 🐛 Troubleshooting

### "Module not found: better-auth"
```bash
npm install better-auth@latest
```

### "Database connection failed"
- Check `DATABASE_URL` in `.env.local`
- Run migration: `node scripts/migrate-auth.mjs`

### "Invalid credentials" on login
- Make sure you created an account first
- Check console for error messages
- Verify database has user records: `SELECT * FROM "user";`

### Social login not working
- Verify OAuth credentials are correct
- Check redirect URIs match exactly
- Look for errors in browser console

### Session not persisting
- Check cookie settings in browser dev tools
- Verify `BETTER_AUTH_SECRET` is set
- Clear cookies and try again

---

## 📝 Files Created/Modified

### New Files
- `src/lib/auth.ts` - Server auth config
- `src/lib/auth-client.ts` - Client auth hooks
- `src/app/api/auth/[...all]/route.ts` - API routes
- `src/app/login/page.tsx` - Login page
- `src/app/signup/page.tsx` - Signup page
- `migrations/002_create_auth_tables.sql` - Database migration
- `scripts/migrate-auth.mjs` - Migration runner

### Modified Files
- `src/lib/db/schema.ts` - Added auth tables
- `package.json` - Already had better-auth

---

## 🎉 You're Ready!

Your authentication system is now fully set up with:
- ✅ Email/password authentication
- ✅ GitHub OAuth (if configured)
- ✅ Google OAuth (if configured)
- ✅ Beautiful brutalism design
- ✅ Cross-subdomain support
- ✅ Secure session management

**Next:** Add middleware, update homepage, and test the complete flow!

---

**Questions?** Check the [Better Auth docs](https://www.better-auth.com/docs) or ask me!
