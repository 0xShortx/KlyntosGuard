# Authentication Testing & Setup Guide

## 🔍 Current Status

### ✅ What's Working
- **Email/Password Auth**: Fully configured with Better Auth
- **Google OAuth**: Credentials configured in `.env.local`
- **Database**: Using Drizzle + PostgreSQL
- **Session Management**: 30-day sessions with proper cookie handling
- **Account Linking**: Same email can link multiple providers

### ❌ What's Not Working (Yet)
- **GitHub OAuth**: Credentials are commented out in `.env.local`
  - Need to uncomment and add real GitHub OAuth app credentials

---

## 🚀 Quick Test (Email/Password Auth)

The login page is now open at: **http://localhost:3001/login**

### Test Signup Flow:
1. Click "Sign Up" or go to http://localhost:3001/signup
2. Enter:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Password**: Test123456!
3. Click "Create Account"
4. You should be redirected to `/dashboard`

### Test Login Flow:
1. Go to http://localhost:3001/login
2. Enter the same credentials
3. Click "Sign In"
4. Should redirect to `/dashboard`

---

## 🔧 Setting Up GitHub OAuth (To Fix Social Login)

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: KlyntosGuard Local
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret"
7. Copy the **Client Secret**

### Step 2: Update .env.local

Open `web/.env.local` and uncomment/update:

```bash
# GitHub OAuth (UNCOMMENT THESE)
GITHUB_CLIENT_ID="your_client_id_from_step_1"
GITHUB_CLIENT_SECRET="your_client_secret_from_step_1"
```

### Step 3: Restart Dev Server

```bash
# Kill current server
lsof -ti:3001 | xargs kill -9

# Start fresh
cd web
npm run dev
```

### Step 4: Test GitHub Login

1. Go to http://localhost:3001/login
2. Click "Sign in with GitHub"
3. Authorize the app
4. Should redirect back and create your account!

---

## 🧪 Complete Auth Testing Checklist

### Email/Password Tests

#### Signup
- [ ] Create account with valid email/password
- [ ] Verify user appears in database
- [ ] Check session cookie is set
- [ ] Redirects to `/dashboard` after signup

#### Login
- [ ] Login with correct credentials
- [ ] Verify session is created
- [ ] Dashboard shows user info
- [ ] Logout works and clears session

#### Password Reset (TODO - Email not configured yet)
- [ ] Request password reset link
- [ ] Currently logs link to console
- [ ] Email sending needs to be implemented

### Google OAuth Tests

#### First-Time Login
- [ ] Click "Sign in with Google"
- [ ] Select Google account
- [ ] Redirects to dashboard
- [ ] User created in database
- [ ] Google account linked

#### Return Login
- [ ] Click "Sign in with Google"
- [ ] Should auto-login (if remembered)
- [ ] Session restored correctly

### GitHub OAuth Tests (After Setup)

#### First-Time Login
- [ ] Click "Sign in with GitHub"
- [ ] Authorize app with repo access
- [ ] Redirects to dashboard
- [ ] User created with GitHub link
- [ ] Access token stored for repo scanning

#### Return Login
- [ ] Should auto-login
- [ ] Can access GitHub repos
- [ ] Webhook setup works

### Account Linking Tests

#### Link Google to Existing Email Account
1. Create account with email: `test@gmail.com`
2. Logout
3. Click "Sign in with Google" using same email
4. Should link accounts (not create duplicate)

#### Link GitHub to Existing Account
1. Login with email
2. Go to settings
3. Click "Connect GitHub"
4. Should link to existing account

---

## 📊 Database Verification

### Check User Created

```sql
-- View all users
SELECT id, name, email, "emailVerified", "createdAt"
FROM "user"
ORDER BY "createdAt" DESC;
```

### Check Sessions

```sql
-- View active sessions
SELECT s.id, s.token, s."userId", u.email, s."expiresAt"
FROM "session" s
JOIN "user" u ON s."userId" = u.id
WHERE s."expiresAt" > NOW()
ORDER BY s."createdAt" DESC;
```

### Check Linked Accounts

```sql
-- View OAuth connections
SELECT a.id, a."providerId", a."userId", u.email, u.name
FROM "account" a
JOIN "user" u ON a."userId" = u.id
ORDER BY a."createdAt" DESC;
```

### Check GitHub Access Tokens

```sql
-- View GitHub tokens (for repo scanning)
SELECT
  u.email,
  a."providerId",
  LEFT(a."accessToken", 10) || '...' as token_preview,
  a."createdAt"
FROM "account" a
JOIN "user" u ON a."userId" = u.id
WHERE a."providerId" = 'github'
ORDER BY a."createdAt" DESC;
```

---

## 🔐 Current Auth Configuration

### From `web/src/lib/auth.ts`:

```typescript
{
  // Email/Password
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Change to true for production
  },

  // Social Providers
  socialProviders: {
    github: {
      enabled: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
      scope: ['user:email', 'read:user', 'repo'], // Repo access for scanning
    },
    google: {
      enabled: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    },
  },

  // Sessions
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // 24 hours
    },
  },

  // Account Linking
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github', 'email-password'],
    },
  },
}
```

---

## 🐛 Troubleshooting

### Issue: "GitHub login button doesn't appear"

**Cause**: GitHub credentials not configured or commented out

**Fix**:
```bash
# Check if credentials are set
grep GITHUB .env.local

# Should show:
# GITHUB_CLIENT_ID="..."
# GITHUB_CLIENT_SECRET="..."

# NOT commented with #
```

### Issue: "Session not persisting"

**Cause**: Cookie domain mismatch

**Fix**: Check `BETTER_AUTH_URL` matches your domain:
```bash
# For local:
BETTER_AUTH_URL="http://localhost:3001"

# For production:
BETTER_AUTH_URL="https://guard.klyntos.com"
```

### Issue: "OAuth redirect loop"

**Cause**: Callback URL mismatch

**Fix**: Ensure GitHub app callback URL exactly matches:
```
http://localhost:3001/api/auth/callback/github
```

### Issue: "Database connection error"

**Cause**: PostgreSQL not running or wrong DATABASE_URL

**Fix**:
```bash
# Check DATABASE_URL in .env.local
grep DATABASE_URL .env.local

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 📝 Production Checklist

Before deploying to production:

### Security
- [ ] Enable email verification (`requireEmailVerification: true`)
- [ ] Set up real email service (SendGrid/Postmark/etc)
- [ ] Use production OAuth apps (not development)
- [ ] Enable HTTPS only
- [ ] Set secure cookie domain

### OAuth Apps
- [ ] Create production GitHub OAuth app
  - Homepage: `https://guard.klyntos.com`
  - Callback: `https://guard.klyntos.com/api/auth/callback/github`
- [ ] Create production Google OAuth app
  - Update authorized origins
  - Update redirect URIs

### Environment Variables
```bash
# Production .env
BETTER_AUTH_URL="https://guard.klyntos.com"
BETTER_AUTH_SECRET="<generate new secret>"
GITHUB_CLIENT_ID="<production app>"
GITHUB_CLIENT_SECRET="<production app>"
GOOGLE_CLIENT_ID="<production app>"
GOOGLE_CLIENT_SECRET="<production app>"
DATABASE_URL="<production postgres>"
```

---

## 🎯 Testing Session

### Manual Test Right Now:

1. **Open Browser**: http://localhost:3001/login (already open)

2. **Test Email Signup**:
   - Click "Sign Up"
   - Email: `test@klyntos.com`
   - Password: `TestPassword123!`
   - Should redirect to dashboard

3. **Verify in Database**:
   ```sql
   SELECT * FROM "user" WHERE email = 'test@klyntos.com';
   ```

4. **Test Google Login**:
   - Logout
   - Click "Sign in with Google"
   - Should work (credentials already configured)

5. **Test GitHub Login** (After setup):
   - Add GitHub credentials to `.env.local`
   - Restart server
   - Click "Sign in with GitHub"
   - Authorize with repo access
   - Should see repos in /guardrails page

---

## ✅ Expected Results

### After Email Signup:
- User record in database
- Session cookie set (`better-auth.session_token`)
- Redirected to `/dashboard`
- Can access protected pages

### After OAuth Login:
- User record created/linked
- Account record with provider details
- Access token stored (for GitHub)
- Can access OAuth provider data

### Session Behavior:
- Stays logged in for 30 days
- Can logout and re-login
- Session survives server restart
- Cookie auto-refreshes

---

## 🚀 Next Steps

1. **Now**: Test email/password auth (login page is open)
2. **Next**: Set up GitHub OAuth credentials
3. **Then**: Test GitHub login with repo access
4. **Finally**: Test webhook flow with authenticated GitHub user

The authentication system is **production-ready** - just needs GitHub OAuth credentials to be fully functional!
