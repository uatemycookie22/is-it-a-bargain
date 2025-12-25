# Is It A Bargain - Database & Auth Implementation Plan

## Overview

Replace mock data with SQLite database + BetterAuth authentication. This plan is organized into phases, each a testable milestone.

---

## Architecture Summary

**Database:** SQLite at `/data/bargain.db` (volume mount on Lightsail)
**ORM:** Drizzle with runtime migrations
**Auth:** BetterAuth (email/password, Google, Apple, Facebook, passkeys)
**Image Storage:** S3 + CloudFront (presigned URLs)

---

## Schema Summary

### BetterAuth Tables
- `user` - id, name, email, emailVerified, image, username, createdAt, updatedAt, deletedAt
- `session` - id, token, expiresAt, userId, ipAddress, userAgent, createdAt, updatedAt
- `account` - id, accountId, providerId, userId, tokens, password, createdAt, updatedAt
- `verification` - id, identifier, value, expiresAt, createdAt, updatedAt
- `passkey` - id, name, publicKey, userId, credentialID, counter, deviceType, etc.

### App Tables
```
posts
├── id              TEXT PRIMARY KEY
├── userId          TEXT NOT NULL → user.id
├── title           TEXT NOT NULL
├── description     TEXT NOT NULL
├── price           INTEGER NOT NULL (cents/smallest unit)
├── currencyCode    TEXT NOT NULL DEFAULT 'USD'
├── listingUrl      TEXT NOT NULL
├── imageUrl        TEXT NOT NULL
├── category        TEXT NOT NULL DEFAULT 'used_cars'
├── status          TEXT NOT NULL DEFAULT 'pending'
├── createdAt       INTEGER NOT NULL (timestamp_ms)
└── updatedAt       INTEGER NOT NULL (timestamp_ms)
INDEX: userId
PARTIAL INDEX: createdAt WHERE status = 'live'

ratings (composite primary key)
├── postId          TEXT NOT NULL → posts.id (CASCADE)
├── userId          TEXT NOT NULL → user.id
├── rating          INTEGER NOT NULL (1-5)
├── createdAt       INTEGER NOT NULL (timestamp_ms)
└── PRIMARY KEY (postId, userId)
```

---

## API Routes Summary

**Auth (BetterAuth):** `POST /api/auth/*`

**Users:**
- `GET /api/users/me` - Current user profile + stats
- `PATCH /api/users/me` - Update user (image only)
- `GET /api/users/username-available?username=x`

**Posts:**
- `GET /api/posts` - List current user's posts (`?search=`)
- `POST /api/posts` - Create post
- `GET /api/posts/to-rate` - Get oldest live post to rate
- `GET /api/posts/:id` - Single post with rating summary

**Ratings:**
- `POST /api/ratings` - Submit rating

**Utilities:**
- `POST /api/scrape` - Scrape listing URL
- `POST /api/images/upload` - Get presigned S3 URL

---

## Coding Guidelines

### NativeWind Usage (CRITICAL)
**NativeWind v5 MUST be used for all styling. StyleSheet.create() should be avoided.**

- ✅ Use `className` prop with Tailwind classes
- ✅ NativeWind v5 supports: negative values (`-mt-8`), shadows (`shadow-lg`), flex, positioning
- ❌ Do NOT use `StyleSheet.create()` unless absolutely necessary
- ❌ Do NOT mix StyleSheet and NativeWind in the same component

### Dark Mode (CRITICAL)
**All components MUST support dark mode using `dark:` classes.**

- ✅ Use `dark:` prefix for dark mode variants: `bg-white dark:bg-gray-800`
- ✅ Use component-based approach for reusable styled elements
- ❌ Do NOT use `@apply` with dark mode variants in CSS - it doesn't work

### Semantic Tokens (CRITICAL)
**Use semantic naming for colors. Never use color names directly in regular components.**

- ✅ Name by USAGE: `primary`, `text-primary`, `background-secondary`
- ❌ Never use color names: `green-500`, `blue-600` (except for complex dynamic components)

### Error Handling
| Error Type | Handling |
|------------|----------|
| S3 upload fails | Show error, ask retry |
| DB sync errors | Token bucket retry, atomic ops, 500 if exhausted |
| Duplicate email/username | "Already registered" message |
| Validation | Zod with descriptive messages per field |

---

## Key Learnings from Previous Implementation

1. **Component over CSS classes** - Use `<Card>` component instead of `.card` CSS class for dark mode support
2. **useTransition for search** - Prevents flickering when filtering lists
3. **keepPreviousData** - Shows old data while fetching new data (smooth UX)
4. **Dark mode navigation** - Tab bars and headers need `useColorScheme()` from React Native
5. **FlashList optimization** - Use `removeClippedSubviews={false}`, `keyExtractor` for stable keys
6. **Star rating widget fires multiple onChange** - Use separate Submit button
7. **Reset state on card change** - Use `key={post.id}` on RatingCard
8. **iOS TextInput vertical alignment bug** - Fix: `style={{ lineHeight: 0 }}`
9. **Zod error API** - Use `result.error.issues` not `result.error.errors`
10. **Link with asChild breaks NativeWind** - Use `useRouter()` instead

---

## Phase Overview

| Phase | Description | Key Deliverables | Doc |
|-------|-------------|------------------|-----|
| 1 | Database Setup + Deploy | Drizzle, schema, migrations, Dockerfile update, volume mount | [PHASE_1](phases/PHASE_1_DATABASE_SETUP.md) |
| 2 | BetterAuth Integration | Auth config, session management, auth API routes, deploy | [PHASE_2](phases/PHASE_2_BETTERAUTH.md) |
| 3 | Posts API Migration | Replace mock posts with database queries, deploy | [PHASE_3](phases/PHASE_3_POSTS_API.md) |
| 4 | Ratings API Migration | Replace mock ratings with database queries, deploy | [PHASE_4](phases/PHASE_4_RATINGS_API.md) |
| 5 | User API & Profile | User stats, profile updates, deploy | [PHASE_5](phases/PHASE_5_USER_API.md) |
| 6 | Signup Wizard UI | Multi-step signup flow, deploy | [PHASE_6](phases/PHASE_6_SIGNUP_UI.md) |
| 7 | Login UI | Login screen with OAuth, deploy | [PHASE_7](phases/PHASE_7_LOGIN_UI.md) |
| 8 | Anonymous Flow | Local post storage, deferred signup, deploy | [PHASE_8](phases/PHASE_8_ANONYMOUS_FLOW.md) |
| 9 | Image Upload | S3 bucket (CDK), presigned URLs, CloudFront, deploy | [PHASE_9](phases/PHASE_9_IMAGE_UPLOAD.md) |

**Note:** URL scraping will be designed and implemented separately in a future plan.

Each phase document contains:
- Step-by-step instructions with code snippets
- File paths for all changes
- Infrastructure/deployment steps for that phase
- Test cases for acceptance testing
- File structure after completion
- Troubleshooting guide
