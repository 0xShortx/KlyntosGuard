# OAuth Local Development Setup

You've already created production OAuth apps, but for **local development** (localhost:3001), you need separate OAuth apps with localhost callback URLs.

## Current Status

✅ **Google OAuth** - Production credentials added
✅ **GitHub OAuth** - Production app created
⚠️ **Local development** - Need localhost OAuth apps

---

## Why Separate OAuth Apps?

OAuth providers require **exact URL matches** for security. Your production apps use:
- GitHub: `https://guard.klyntos.com/api/auth/callback/github`
- Google: `https://guard.klyntos.com/api/auth/callback/google`

But locally you need:
- GitHub: `http://localhost:3001/api/auth/callback/github`
- Google: `http://localhost:3001/api/auth/callback/google`

---

## Option 1: Add Localhost to Google (Recommended)

Google allows multiple redirect URIs in the same app!

### Steps:

1. Go to https://console.cloud.google.com/
2. Navigate to your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth Client ID
5. Under "Authorized redirect URIs", click "+ ADD URI"
6. Add: `http://localhost:3001/api/auth/callback/google`
7. Click "SAVE"

**That's it!** Your existing Google credentials will now work for both production AND local development.

---

## Option 2: Create Local GitHub OAuth App

GitHub requires separate apps for different domains.

### Steps:

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Klyntos Guard Dev (Local)
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret"
7. Copy the **Client Secret**

### Update .env.local

Uncomment and update these lines in `/web/.env.local`:

```bash
# GitHub OAuth (Local Development)
GITHUB_CLIENT_ID="your_new_local_client_id"
GITHUB_CLIENT_SECRET="your_new_local_client_secret"
```

---

## Testing OAuth Locally

After setting up:

1. **Restart your dev server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Visit the signup page:**
   ```
   http://localhost:3001/signup
   ```

3. **You should see:**
   - ✅ "Continue with Google" button (if Google redirect added)
   - ✅ "Continue with GitHub" button (if GitHub local app created)

4. **Click a social login button:**
   - Should redirect to OAuth provider
   - After authorizing, should redirect back to your app
   - Should create account and sign you in

---

## Production Deployment

When deploying to `https://guard.klyntos.com`, update `.env` to use production credentials:

```bash
# Use production OAuth credentials
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

GITHUB_CLIENT_ID="your_production_github_client_id"
GITHUB_CLIENT_SECRET="your_production_github_client_secret"
```

The production GitHub app you created will work automatically once deployed!

---

## Quick Test Without OAuth

Don't want to set up OAuth right now? **You can still test everything else!**

Just use **email/password authentication**:

1. Visit http://localhost:3001/signup
2. Create account with email + password
3. Sign in at http://localhost:3001/login
4. Access dashboard
5. Click "Sign Out"

OAuth is **optional** - email/password works perfectly! ✅

---

## Summary

### For Local Development (localhost:3001):

**Google:**
- [x] Add `http://localhost:3001/api/auth/callback/google` to existing app
- [x] Already have credentials in `.env.local`

**GitHub:**
- [ ] Create new OAuth app for localhost
- [ ] Add credentials to `.env.local`

**OR:**

- [x] Just use email/password (already working!)

---

**Questions?** The email/password flow is fully functional. OAuth is just an optional convenience! 🚀
