# Phase 4: Ratings API Migration

## Goal
Replace mock ratings with database queries. Implement rating submission and post status transitions.

## Prerequisites
- Phase 3 complete (posts API)

---

## Steps

### 4.1 Create Ratings Repository

**File:** `db/repositories/ratings.ts`

```ts
import { db } from "@/db/client";
import { ratings, posts, user } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

const RATINGS_TO_PUBLISH = 2;
const RATINGS_TO_COMPLETE = 5;

export async function createRating(data: { postId: string; userId: string; rating: number }) {
  const now = Date.now();

  await db.insert(ratings).values({
    postId: data.postId,
    userId: data.userId,
    rating: data.rating,
    createdAt: new Date(now),
  });

  // Update post's rating count and potentially status
  await updatePostAfterRating(data.postId);

  // Check if user's pending post should be published
  await checkAndPublishUserPost(data.userId);

  return getRating(data.postId, data.userId);
}

export async function getRating(postId: string, userId: string) {
  return db.query.ratings.findFirst({
    where: and(eq(ratings.postId, postId), eq(ratings.userId, userId)),
  });
}

export async function hasUserRatedPost(postId: string, userId: string) {
  const existing = await getRating(postId, userId);
  return !!existing;
}

export async function getPostRatingCount(postId: string) {
  const result = await db
    .select({ count: count() })
    .from(ratings)
    .where(eq(ratings.postId, postId));

  return result[0]?.count || 0;
}

export async function getUserRatingCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(ratings)
    .where(eq(ratings.userId, userId));

  return result[0]?.count || 0;
}

async function updatePostAfterRating(postId: string) {
  const ratingCount = await getPostRatingCount(postId);

  // If post has enough ratings, mark as "rated"
  if (ratingCount >= RATINGS_TO_COMPLETE) {
    await db
      .update(posts)
      .set({ status: "rated", updatedAt: new Date() })
      .where(and(eq(posts.id, postId), eq(posts.status, "live")));
  }
}

async function checkAndPublishUserPost(userId: string) {
  // Get user's pending post
  const pendingPost = await db.query.posts.findFirst({
    where: and(eq(posts.userId, userId), eq(posts.status, "pending")),
  });

  if (!pendingPost) return;

  // Count how many ratings user has given
  const userRatingCount = await getUserRatingCount(userId);

  // If user has rated enough posts, publish their pending post
  if (userRatingCount >= RATINGS_TO_PUBLISH) {
    await db
      .update(posts)
      .set({ status: "live", updatedAt: new Date() })
      .where(eq(posts.id, pendingPost.id));
  }
}

export async function getRatingsNeededToPublish(userId: string) {
  const userRatingCount = await getUserRatingCount(userId);
  return Math.max(0, RATINGS_TO_PUBLISH - userRatingCount);
}
```

### 4.2 Update Ratings API Route

**File:** `app/api/ratings+api.ts` (replace)

```ts
import { requireAuth } from "@/lib/auth-server";
import { createRating, hasUserRatedPost } from "@/db/repositories/ratings";
import { getPostById } from "@/db/repositories/posts";
import { z } from "zod";

const ratingSchema = z.object({
  postId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  const session = await requireAuth(request);
  const body = await request.json();

  // Validate input
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { postId, rating } = parsed.data;

  // Check post exists
  const post = await getPostById(postId);
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Can't rate own post
  if (post.userId === session.user.id) {
    return Response.json({ error: "Cannot rate your own post" }, { status: 400 });
  }

  // Can't rate non-live posts
  if (post.status !== "live") {
    return Response.json({ error: "Can only rate live posts" }, { status: 400 });
  }

  // Check if already rated
  const alreadyRated = await hasUserRatedPost(postId, session.user.id);
  if (alreadyRated) {
    return Response.json({ error: "Already rated this post" }, { status: 400 });
  }

  // Create rating
  const newRating = await createRating({
    postId,
    userId: session.user.id,
    rating,
  });

  return Response.json({ rating: newRating }, { status: 201 });
}
```

### 4.3 Update Types

**File:** `types/index.ts` (update)

```ts
export type PostStatus = "pending" | "live" | "rated";

export type Post = {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  currencyCode: string;
  listingUrl: string;
  imageUrl: string;
  category: string;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (from API)
  averageRating?: number;
  ratingCount?: number;
  ratingBreakdown?: Record<number, number>;
};

export type Rating = {
  postId: string;
  userId: string;
  rating: number;
  createdAt: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (from API)
  totalPosts?: number;
  averageRating?: number;
  totalRatingsGiven?: number;
  ratingsNeededToPublish?: number;
};
```

---

## Deploy

```bash
git add .
git commit -m "Phase 4: Ratings API migration to database"
git push origin main
```

---

## File Structure After Phase 4

```
is-it-a-bargain/
├── db/
│   ├── repositories/
│   │   ├── posts.ts
│   │   └── ratings.ts     # NEW - Rating database operations
│   └── ...
├── app/
│   └── api/
│       └── ratings+api.ts # UPDATED - Uses database
├── types/
│   └── index.ts           # UPDATED - New types
└── ... existing files
```

---

## Test Cases

### TC4.1: Submit Rating
- [ ] Create user A with a live post
- [ ] Login as user B
- [ ] POST `/api/ratings` with postId and rating (1-5)
- [ ] Should return created rating
- [ ] Verify rating in database

### TC4.2: Rating Validation
- [ ] POST `/api/ratings` with rating = 0
- [ ] Should return 400 (min is 1)
- [ ] POST `/api/ratings` with rating = 6
- [ ] Should return 400 (max is 5)

### TC4.3: Can't Rate Own Post
- [ ] Login as user A
- [ ] POST `/api/ratings` for user A's own post
- [ ] Should return 400 "Cannot rate your own post"

### TC4.4: Can't Rate Twice
- [ ] Rate a post
- [ ] Try to rate same post again
- [ ] Should return 400 "Already rated this post"

### TC4.5: Can't Rate Non-Live Post
- [ ] Create a pending post
- [ ] Try to rate it
- [ ] Should return 400 "Can only rate live posts"

### TC4.6: Post Status Transitions - Pending to Live
- [ ] User A creates a post (status = pending)
- [ ] User A rates 2 other posts
- [ ] User A's post should now be status = live

### TC4.7: Post Status Transitions - Live to Rated
- [ ] Create a live post
- [ ] Have 5 different users rate it
- [ ] Post should now be status = rated

### TC4.8: Rating Summary Updates
- [ ] Create a live post
- [ ] Rate it with 5 stars
- [ ] GET `/api/posts/{id}`
- [ ] Should show averageRating = 5, ratingCount = 1
- [ ] Rate it with 3 stars (different user)
- [ ] Should show averageRating = 4, ratingCount = 2

---

## Troubleshooting

### "UNIQUE constraint failed: ratings.post_id, ratings.user_id"
- User already rated this post
- Check `hasUserRatedPost` before inserting

### Post not transitioning to "live"
- Check user has rated at least 2 posts
- Verify `checkAndPublishUserPost` is being called

### Post not transitioning to "rated"
- Check post has at least 5 ratings
- Verify `updatePostAfterRating` is being called
