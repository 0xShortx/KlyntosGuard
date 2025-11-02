# KlyntosGuard Web UI

Next.js web interface for KlyntosGuard AI safety guardrails platform.

## Features

- 🎨 **Modern UI** - Built with Next.js 15 + TypeScript + Tailwind CSS
- 🔐 **Better Auth** - Shared authentication with main Klyntos platform
- 🔑 **CLI API Keys** - Generate and manage API keys for CLI access
- 📊 **Dashboard** - Monitor guardrails activity and usage
- ⚙️ **Settings** - Configure guardrails and manage account

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: Better Auth (shared sessions)
- **Database**: PostgreSQL + Drizzle ORM
- **API**: Communicates with FastAPI backend

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Set Up Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your values:

```env
DATABASE_URL="postgresql://klyntos:password@localhost:5432/klyntos_guard"
BETTER_AUTH_SECRET="your-secret-min-32-chars"
JWT_SECRET_KEY="your-jwt-secret-min-32-chars"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Homepage
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── settings/          # Settings pages
│   │   │   └── cli/           # CLI API key management
│   │   └── api/               # API routes
│   │       └── cli/           # CLI endpoints
│   │           ├── generate-key/
│   │           ├── verify-key/
│   │           └── keys/
│   ├── components/
│   │   └── ui/                # Shadcn UI components
│   └── lib/
│       ├── auth.ts            # Better Auth config
│       └── utils.ts           # Utility functions
├── public/                     # Static assets
└── package.json
```

## API Endpoints

### CLI Key Management

- `POST /api/cli/generate-key` - Generate new API key
- `POST /api/cli/verify-key` - Exchange API key for JWT
- `GET /api/cli/keys` - List user's API keys
- `DELETE /api/cli/keys` - Revoke API key

### Authentication

- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get session

## Pages

### Home (`/`)
- Landing page with product overview
- Quick start guide
- Feature showcase

### Dashboard (`/dashboard`)
- Guardrails activity monitoring
- Usage statistics
- Recent violations

### Settings → CLI (`/settings/cli`)
- Generate API keys for CLI access
- View and manage existing keys
- Revoke keys
- Copy setup commands

## Development

### Running Locally

```bash
# Development mode (port 3001)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

### Adding Shadcn Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

## Environment Variables

Required:

```env
DATABASE_URL                # PostgreSQL connection string
BETTER_AUTH_SECRET          # Better Auth secret (shared with main app)
JWT_SECRET_KEY              # JWT secret (shared with Python API)
BETTER_AUTH_URL             # This app's URL
NEXT_PUBLIC_APP_URL         # Public app URL
NEXT_PUBLIC_API_URL         # Python API URL
```

Optional:

```env
ENCRYPTION_KEY              # Additional encryption (shared with main app)
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel
```

Add environment variables in Vercel dashboard.

### Custom Domain

1. Go to Vercel project settings
2. Add domain: `guard.klyntos.com`
3. Follow DNS instructions

## Integration with Python API

This web UI communicates with the FastAPI backend:

```
Web UI (port 3001) → FastAPI (port 8000)
```

**API Key Flow:**

1. User generates API key in web UI (`/settings/cli`)
2. Web UI calls `/api/cli/generate-key`
3. Key is hashed and stored in database
4. User copies key to CLI
5. CLI calls `/api/cli/verify-key` with key
6. Web UI verifies and returns JWT token
7. CLI uses JWT for all subsequent requests

## Security

- ✅ API keys are hashed with bcrypt
- ✅ JWT tokens expire (configurable)
- ✅ HTTPS enforced in production
- ✅ CORS configured
- ✅ Session cookies are HTTP-only
- ✅ Cross-subdomain cookies for SSO

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Contributing

1. Create feature branch
2. Make changes
3. Run `npm run lint`
4. Submit pull request

## License

MIT

---

**Need Help?**

- [KlyntosGuard Documentation](../README.md)
- [Bridge Auth Guide](../BRIDGE_AUTH_GUIDE.md)
- [API Documentation](http://localhost:8000/docs)



i created this database for us # Recommended for most uses
DATABASE_URL=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Parameters for constructing your own connection string
PGHOST=ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech
PGHOST_UNPOOLED=ep-holy-night-ad39jkqj.c-2.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_XQxkJME50Dsq

# Parameters for Vercel Postgres Templates
POSTGRES_URL=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_XQxkJME50Dsq
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_XQxkJME50Dsq@ep-holy-night-ad39jkqj-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=7f17f52b-4890-49f3-ac38-bc10d962c786
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_7krq5wh7fv26j105n0vz0rt5xfywn60nkgw8mkgs3mg08
STACK_SECRET_SERVER_KEY=ssk_sd78t8w82x99khkkqans42ckbps08q5t94fs7hdbsr8xr // src/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" }); // or .env.local

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql }); // prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url  	    = env("DATABASE_URL")
}




