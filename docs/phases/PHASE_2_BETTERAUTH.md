# Phase 2: BetterAuth Integration

## Goal
Set up BetterAuth with email/password, OAuth providers, passkeys, and email verification.

## Prerequisites
- Phase 1 complete (database setup)

---

## Steps

### 2.1 Install Dependencies

```bash
npm install better-auth @better-auth/passkey
```

### 2.2 Create Auth Configuration

**File:** `lib/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { username } from "better-auth/plugins";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      // TODO: Implement email sending
      console.log(`Verification code for ${user.email}: ${token}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      enabled: true, // Auto-link accounts with same email
    },
  },
  plugins: [
    username(),
    passkey({
      rpID: process.env.NODE_ENV === "production"
        ? "bargain-api.callingallheroes.net"
        : "localhost",
      rpName: "Is It A Bargain",
      origin: process.env.BETTER_AUTH_URL,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year
    updateAge: 60 * 60 * 24 * 7,   // refresh weekly
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour cache before DB check
    },
  },
});
```

### 2.3 Create Auth Client (for mobile app)

**File:** `lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { usernameClient } from "better-auth/client/plugins";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://bargain-api.callingallheroes.net";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    usernameClient(),
    passkeyClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 2.4 Create Auth API Route

**File:** `app/api/auth/[...all]+api.ts`

```ts
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  return auth.handler(request);
}

export async function POST(request: Request) {
  return auth.handler(request);
}
```

### 2.5 Create Auth Helper for API Routes

**File:** `lib/auth-server.ts`

```ts
import { auth } from "./auth";

export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

export async function requireAuth(request: Request) {
  const session = await getSession(request);
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}
```

### 2.6 Create Username Availability Endpoint

**File:** `app/api/users/username-available+api.ts`

```ts
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return Response.json({ error: "Username required" }, { status: 400 });
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return Response.json({
      available: false,
      error: "Username must be 3-20 characters, alphanumeric and underscores only",
    });
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.username, username.toLowerCase()),
  });

  return Response.json({ available: !existing });
}
```

### 2.7 Add Environment Variables

**File:** `.env.example` (create)

```env
# Database
DATABASE_URL=./data/bargain.db

# BetterAuth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3001

# OAuth Providers (get from respective developer consoles)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# S3 (Phase 9)
AWS_S3_BUCKET=
AWS_REGION=us-east-1
CLOUDFRONT_URL=
```

### 2.8 Update app.json for API URL

**File:** `app.json` (update extra section)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://bargain-api.callingallheroes.net"
    }
  }
}
```

---

## Deploy

```bash
git add .
git commit -m "Phase 2: BetterAuth integration"
git push origin main
```

### Add GitHub Secrets (if not already added)
- `BETTER_AUTH_SECRET` - Random secret for BetterAuth

### Update deploy.yml to pass env var
Add to podman run command:
```yaml
-e BETTER_AUTH_SECRET="${{ secrets.BETTER_AUTH_SECRET }}" \
-e BETTER_AUTH_URL=https://bargain-api.callingallheroes.net \
```

---

## File Structure After Phase 2

```
is-it-a-bargain/
├── app/
│   └── api/
│       ├── auth/
│       │   └── [...all]+api.ts    # NEW - BetterAuth handler
│       └── users/
│           └── username-available+api.ts  # NEW
├── lib/
│   ├── auth.ts            # NEW - Auth server config
│   ├── auth-client.ts     # NEW - Auth client for mobile
│   └── auth-server.ts     # NEW - Auth helpers
├── .env.example           # NEW - Environment template
└── ... existing files
```

---

## Test Cases

### TC2.1: Auth Route Responds
- [ ] Start server
- [ ] `curl http://localhost:3001/api/auth/session`
- [ ] Should return `{ "session": null }` (not logged in)

### TC2.2: Email Signup (without verification for now)
- [ ] POST to `/api/auth/sign-up/email` with email, password, name
- [ ] Check console for verification code log
- [ ] Verify user created in database (use Drizzle Studio)

### TC2.3: Email Login
- [ ] POST to `/api/auth/sign-in/email` with email, password
- [ ] Should return session token
- [ ] GET `/api/auth/session` with token should return user

### TC2.4: Username Availability
- [ ] GET `/api/users/username-available?username=testuser`
- [ ] Should return `{ "available": true }`
- [ ] Create user with that username
- [ ] Same request should return `{ "available": false }`

### TC2.5: Username Validation
- [ ] GET `/api/users/username-available?username=ab` (too short)
- [ ] Should return error about length
- [ ] GET `/api/users/username-available?username=test@user` (invalid char)
- [ ] Should return error about format

### TC2.6: Session Persistence
- [ ] Login and get session token
- [ ] Wait 5 seconds
- [ ] GET `/api/auth/session` with same token
- [ ] Should still be valid

---

## Troubleshooting

### "BETTER_AUTH_SECRET is required"
- Create `.env` file with `BETTER_AUTH_SECRET=any-random-string`
- For production, use a secure random string

### OAuth redirect errors
- OAuth providers not configured yet - skip OAuth tests until credentials added
- Will configure in Phase 6 when building signup UI

### "Cannot read properties of undefined (reading 'id')"
- Ensure database migrations ran successfully
- Check that schema matches BetterAuth expected tables

---

## Notes

- OAuth credentials (Google, Apple, Facebook) will be set up in Phase 6 when building the signup UI
- Email sending is stubbed (console.log) - will implement actual email in Phase 6
- Passkeys require HTTPS in production - will work on localhost for testing
