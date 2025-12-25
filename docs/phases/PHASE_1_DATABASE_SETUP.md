# Phase 1: Database Setup + Deploy

## Goal
Set up Drizzle ORM with SQLite, create schema, configure migrations, update Dockerfile, and deploy.

---

## Steps

### 1.1 Install Dependencies

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

### 1.2 Create Drizzle Config

**File:** `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "./data/bargain.db",
  },
});
```

### 1.3 Create Database Schema

**File:** `db/schema.ts`

```ts
import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ============================================================================
// Auth tables (BetterAuth) - will be used in Phase 2
// ============================================================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  username: text("username").notNull().unique().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const passkey = sqliteTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" }).notNull(),
    transports: text("transports"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    aaguid: text("aaguid"),
  },
  (table) => [
    index("passkey_userId_idx").on(table.userId),
    index("passkey_credentialID_idx").on(table.credentialID),
  ]
);

// ============================================================================
// App tables
// ============================================================================

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(), // cents/smallest currency unit
    currencyCode: text("currency_code").notNull().default("USD"),
    listingUrl: text("listing_url").notNull(),
    imageUrl: text("image_url").notNull(),
    category: text("category").notNull().default("used_cars"),
    status: text("status", { enum: ["pending", "live", "rated"] }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("posts_userId_idx").on(table.userId),
    index("posts_live_createdAt_idx")
      .on(table.createdAt)
      .where(sql`status = 'live'`),
  ]
);

export const ratings = sqliteTable(
  "ratings",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    rating: integer("rating").notNull(), // 1-5
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })]
);

// ============================================================================
// Relations
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  posts: many(posts),
  ratings: many(ratings),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(user, { fields: [posts.userId], references: [user.id] }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  post: one(posts, { fields: [ratings.postId], references: [posts.id] }),
  user: one(user, { fields: [ratings.userId], references: [user.id] }),
}));

// ============================================================================
// Type exports
// ============================================================================

export type User = typeof user.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
```

### 1.4 Create Database Client

**File:** `db/client.ts`

```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "./data/bargain.db");
export const db = drizzle(sqlite, { schema });
```

### 1.5 Create Migration Runner

**File:** `db/migrate.ts`

```ts
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

export function runMigrations() {
  console.log("Running migrations...");
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
}
```

### 1.6 Generate Initial Migration

```bash
mkdir -p data
npx drizzle-kit generate
```

### 1.7 Update Server Entry Point

**File:** `server.ts` (update)

```ts
import { runMigrations } from "./db/migrate";

// Run migrations before starting server
runMigrations();

// ... existing server code
```

### 1.8 Update .gitignore

```bash
echo "data/*.db" >> .gitignore
echo "data/*.db-journal" >> .gitignore
```

---

## Infrastructure & Deployment

### 1.9 Update Dockerfile

**File:** `Dockerfile` (update)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx expo export -p web --no-ssg

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_URL=/data/bargain.db
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### 1.10 Update GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml` (update)

Add volume mount for SQLite persistence:

```yaml
# In the deploy step, update the podman run command:
podman run -d \
  --name bargain-api \
  -p 3001:3001 \
  -v /data/bargain:/data:Z \
  -e DATABASE_URL=/data/bargain.db \
  --restart unless-stopped \
  814155132173.dkr.ecr.us-east-1.amazonaws.com/bargain-api-ecr-repo:latest
```

### 1.11 Create Data Directory on Lightsail

SSH into the instance and create the directory:

```bash
ssh ubuntu@18.215.116.116
sudo mkdir -p /data/bargain
sudo chown ubuntu:ubuntu /data/bargain
```

### 1.12 Deploy

```bash
git add .
git commit -m "Phase 1: Database setup with Drizzle + SQLite"
git push origin main
```

---

## File Structure After Phase 1

```
is-it-a-bargain/
├── db/
│   ├── schema.ts          # NEW - Database schema
│   ├── client.ts          # NEW - Database client
│   └── migrate.ts         # NEW - Migration runner
├── drizzle/
│   └── 0000_*.sql         # NEW - Generated migration
├── data/
│   └── bargain.db         # NEW - SQLite database (gitignored)
├── drizzle.config.ts      # NEW - Drizzle config
├── Dockerfile             # UPDATED - Volume mount, migrations
├── .github/workflows/
│   └── deploy.yml         # UPDATED - Volume mount
├── server.ts              # UPDATED - Run migrations on startup
└── ... existing files
```

---

## Test Cases

### TC1.1: Local - Schema Generation
- [ ] Run `npx drizzle-kit generate`
- [ ] Verify migration file created in `drizzle/` folder

### TC1.2: Local - Database Creation
- [ ] Run `npm run dev`
- [ ] Verify `data/bargain.db` file created
- [ ] No errors in console

### TC1.3: Local - Migration Idempotency
- [ ] Stop and restart server
- [ ] Verify "Migrations complete" logged without errors

### TC1.4: Local - Schema Inspection
- [ ] Run `npx drizzle-kit studio`
- [ ] Verify all tables visible

### TC1.5: Deploy - GitHub Actions
- [ ] Push to main
- [ ] Verify workflow completes successfully

### TC1.6: Deploy - Health Check
- [ ] `curl https://bargain-api.callingallheroes.net/health`
- [ ] Should return OK (or existing response)

### TC1.7: Deploy - Database Persistence
- [ ] SSH to instance
- [ ] Verify `/data/bargain/bargain.db` exists
- [ ] Redeploy
- [ ] Database file should still exist

---

## Troubleshooting

### "Cannot find module 'better-sqlite3'"
- Run `npm install better-sqlite3`
- If on M1 Mac: `npm rebuild better-sqlite3`

### "SQLITE_CANTOPEN: unable to open database file"
- Ensure `data/` directory exists locally
- On server, ensure `/data/bargain/` exists with correct permissions

### Container won't start after deploy
- Check logs: `podman logs bargain-api`
- Verify volume mount path exists
- Check DATABASE_URL env var
