# Phase 3: Posts API Migration

## Goal
Replace mock posts data with database queries. Maintain existing API contracts.

## Prerequisites
- Phase 1 complete (database setup)
- Phase 2 complete (auth setup)

---

## Steps

### 3.1 Create Post Repository

**File:** `db/repositories/posts.ts`

```ts
import { db } from "@/db/client";
import { posts, ratings } from "@/db/schema";
import { eq, and, ne, sql, desc, asc, like, or, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function createPost(data: {
  userId: string;
  title: string;
  description: string;
  price: number;
  currencyCode?: string;
  listingUrl: string;
  imageUrl: string;
  category?: string;
}) {
  const id = nanoid();
  const now = Date.now();

  await db.insert(posts).values({
    id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    price: data.price,
    currencyCode: data.currencyCode || "USD",
    listingUrl: data.listingUrl,
    imageUrl: data.imageUrl,
    category: data.category || "used_cars",
    status: "pending",
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });

  return db.query.posts.findFirst({ where: eq(posts.id, id) });
}

export async function getPostById(id: string) {
  return db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { user: true },
  });
}

export async function getPostsByUser(
  userId: string,
  options: { search?: string; limit?: number; offset?: number } = {}
) {
  const { search, limit = 10, offset = 0 } = options;

  let whereClause = eq(posts.userId, userId);

  if (search) {
    whereClause = and(
      whereClause,
      or(
        like(posts.title, `%${search}%`),
        like(posts.description, `%${search}%`)
      )
    )!;
  }

  const results = await db.query.posts.findMany({
    where: whereClause,
    orderBy: desc(posts.createdAt),
    limit: limit + 1, // fetch one extra to check if there's more
    offset,
  });

  const hasMore = results.length > limit;
  const postsData = hasMore ? results.slice(0, limit) : results;

  return {
    posts: postsData,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  };
}

export async function getPostToRate(userId: string) {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Get posts user has already rated
  const userRatings = await db
    .select({ postId: ratings.postId })
    .from(ratings)
    .where(eq(ratings.userId, userId));

  const ratedPostIds = userRatings.map((r) => r.postId);

  // Find oldest live post not by user and not already rated
  const result = await db.query.posts.findFirst({
    where: and(
      eq(posts.status, "live"),
      ne(posts.userId, userId),
      gte(posts.createdAt, new Date(oneWeekAgo)),
      ratedPostIds.length > 0
        ? sql`${posts.id} NOT IN (${sql.join(ratedPostIds.map(id => sql`${id}`), sql`, `)})`
        : undefined
    ),
    orderBy: asc(posts.createdAt),
  });

  return result;
}

export async function updatePostStatus(id: string, status: "pending" | "live" | "rated") {
  await db
    .update(posts)
    .set({ status, updatedAt: new Date() })
    .where(eq(posts.id, id));

  return getPostById(id);
}

export async function getPostWithRatingSummary(id: string) {
  const post = await getPostById(id);
  if (!post) return null;

  const ratingsData = await db
    .select({ rating: ratings.rating })
    .from(ratings)
    .where(eq(ratings.postId, id));

  const ratingCount = ratingsData.length;
  const averageRating = ratingCount > 0
    ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    : 0;

  // Calculate breakdown
  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingsData.forEach((r) => {
    ratingBreakdown[r.rating]++;
  });

  return {
    ...post,
    ratingCount,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingBreakdown,
  };
}

export async function getUserPendingPost(userId: string) {
  return db.query.posts.findFirst({
    where: and(eq(posts.userId, userId), eq(posts.status, "pending")),
  });
}
```

### 3.2 Update Posts API Route

**File:** `app/api/posts+api.ts` (replace)

```ts
import { requireAuth } from "@/lib/auth-server";
import { createPost, getPostsByUser, getUserPendingPost } from "@/db/repositories/posts";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(1000),
  price: z.number().int().min(1),
  currencyCode: z.string().length(3).optional(),
  listingUrl: z.string().url(),
  imageUrl: z.string().url(),
  category: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "0");
  const limit = 10;

  const result = await getPostsByUser(session.user.id, {
    search,
    limit,
    offset: page * limit,
  });

  return Response.json({
    posts: result.posts,
    nextPage: result.hasMore ? page + 1 : null,
  });
}

export async function POST(request: Request) {
  const session = await requireAuth(request);
  const body = await request.json();

  // Validate input
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Check if user already has a pending post
  const pendingPost = await getUserPendingPost(session.user.id);
  if (pendingPost) {
    return Response.json(
      { error: "You already have a pending post. Rate others to publish it." },
      { status: 400 }
    );
  }

  const post = await createPost({
    userId: session.user.id,
    ...parsed.data,
  });

  return Response.json({ post }, { status: 201 });
}
```

### 3.3 Update Single Post API Route

**File:** `app/api/posts/[id]+api.ts` (replace)

```ts
import { requireAuth } from "@/lib/auth-server";
import { getPostWithRatingSummary, updatePostStatus } from "@/db/repositories/posts";
import { z } from "zod";

export async function GET(request: Request, { id }: { id: string }) {
  // No auth required to view a post
  const post = await getPostWithRatingSummary(id);

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json({ post });
}

const updateSchema = z.object({
  status: z.enum(["pending", "live", "rated"]).optional(),
});

export async function PATCH(request: Request, { id }: { id: string }) {
  const session = await requireAuth(request);
  const body = await request.json();

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const post = await getPostWithRatingSummary(id);
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Only owner can update their post
  if (post.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.status) {
    const updated = await updatePostStatus(id, parsed.data.status);
    return Response.json({ post: updated });
  }

  return Response.json({ post });
}
```

### 3.4 Update Posts To Rate API Route

**File:** `app/api/posts-to-rate+api.ts` (replace)

```ts
import { requireAuth } from "@/lib/auth-server";
import { getPostToRate } from "@/db/repositories/posts";

export async function GET(request: Request) {
  const session = await requireAuth(request);

  const post = await getPostToRate(session.user.id);

  return Response.json({ post: post || null });
}
```

### 3.5 Install nanoid

```bash
npm install nanoid
```

### 3.6 Delete Mock Data (optional, keep for reference)

Rename `mocks/data.ts` to `mocks/data.ts.bak` or delete after confirming everything works.

---

## Deploy

```bash
git add .
git commit -m "Phase 3: Posts API migration to database"
git push origin main
```

Verify after deploy:
- `curl https://bargain-api.callingallheroes.net/api/posts` (should return 401 without auth)

---

## File Structure After Phase 3

```
is-it-a-bargain/
├── db/
│   ├── repositories/
│   │   └── posts.ts       # NEW - Post database operations
│   ├── schema.ts
│   ├── client.ts
│   └── migrate.ts
├── app/
│   └── api/
│       ├── posts+api.ts           # UPDATED - Uses database
│       ├── posts/
│       │   └── [id]+api.ts        # UPDATED - Uses database
│       └── posts-to-rate+api.ts   # UPDATED - Uses database
└── ... existing files
```

---

## Test Cases

### TC3.1: Create Post (Authenticated)
- [ ] Login and get session token
- [ ] POST `/api/posts` with valid data
- [ ] Should return created post with id
- [ ] Verify post in database (Drizzle Studio)

### TC3.2: Create Post (Unauthenticated)
- [ ] POST `/api/posts` without auth header
- [ ] Should return 401 Unauthorized

### TC3.3: Create Post Validation
- [ ] POST `/api/posts` with title < 5 chars
- [ ] Should return 400 with validation error
- [ ] POST `/api/posts` with invalid URL
- [ ] Should return 400 with validation error

### TC3.4: List User Posts
- [ ] Create 3 posts for user
- [ ] GET `/api/posts`
- [ ] Should return all 3 posts, newest first

### TC3.5: Search Posts
- [ ] Create posts with different titles
- [ ] GET `/api/posts?search=honda`
- [ ] Should return only matching posts

### TC3.6: Pagination
- [ ] Create 15 posts
- [ ] GET `/api/posts?page=0`
- [ ] Should return 10 posts with `nextPage: 1`
- [ ] GET `/api/posts?page=1`
- [ ] Should return 5 posts with `nextPage: null`

### TC3.7: Get Single Post
- [ ] GET `/api/posts/{id}` for existing post
- [ ] Should return post with rating summary
- [ ] GET `/api/posts/nonexistent`
- [ ] Should return 404

### TC3.8: Pending Post Limit
- [ ] Create a post (status = pending)
- [ ] Try to create another post
- [ ] Should return 400 "already have a pending post"

### TC3.9: Posts To Rate
- [ ] Create user A with a live post
- [ ] Login as user B
- [ ] GET `/api/posts-to-rate`
- [ ] Should return user A's post

### TC3.10: Posts To Rate Excludes Own
- [ ] Login as user A (who has a live post)
- [ ] GET `/api/posts-to-rate`
- [ ] Should NOT return user A's own post

---

## Troubleshooting

### "Cannot find module 'nanoid'"
- Run `npm install nanoid`

### Posts not showing up
- Check that posts have correct userId
- Verify status is 'live' for to-rate queries
- Check createdAt is within 1 week for to-rate

### Rating summary shows 0
- Ratings table may be empty
- Will be populated in Phase 4
