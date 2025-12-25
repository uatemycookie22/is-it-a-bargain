# Phase 5: User API & Profile

## Goal
Implement user profile API with stats, profile updates (image).

## Prerequisites
- Phase 4 complete (ratings API)

---

## Steps

### 5.1 Create Users Repository

**File:** `db/repositories/users.ts`

```ts
import { db } from "@/db/client";
import { user, posts, ratings } from "@/db/schema";
import { eq, count, avg, and, ne } from "drizzle-orm";

export async function getUserById(id: string) {
  return db.query.user.findFirst({
    where: and(eq(user.id, id), eq(user.deletedAt, null)),
  });
}

export async function getUserByEmail(email: string) {
  return db.query.user.findFirst({
    where: and(eq(user.email, email.toLowerCase()), eq(user.deletedAt, null)),
  });
}

export async function getUserByUsername(username: string) {
  return db.query.user.findFirst({
    where: and(eq(user.username, username.toLowerCase()), eq(user.deletedAt, null)),
  });
}

export async function updateUser(id: string, data: { image?: string; username?: string }) {
  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, id));

  return getUserById(id);
}

export async function getUserWithStats(id: string) {
  const userData = await getUserById(id);
  if (!userData) return null;

  // Get total posts
  const postsResult = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.userId, id));
  const totalPosts = postsResult[0]?.count || 0;

  // Get average rating received on user's posts
  const avgRatingResult = await db
    .select({ avg: avg(ratings.rating) })
    .from(ratings)
    .innerJoin(posts, eq(ratings.postId, posts.id))
    .where(eq(posts.userId, id));
  const averageRating = avgRatingResult[0]?.avg
    ? Math.round(Number(avgRatingResult[0].avg) * 10) / 10
    : 0;

  // Get total ratings given
  const ratingsGivenResult = await db
    .select({ count: count() })
    .from(ratings)
    .where(eq(ratings.userId, id));
  const totalRatingsGiven = ratingsGivenResult[0]?.count || 0;

  // Get pending post and ratings needed
  const pendingPost = await db.query.posts.findFirst({
    where: and(eq(posts.userId, id), eq(posts.status, "pending")),
  });

  const RATINGS_TO_PUBLISH = 2;
  const ratingsNeededToPublish = pendingPost
    ? Math.max(0, RATINGS_TO_PUBLISH - totalRatingsGiven)
    : 0;

  return {
    ...userData,
    totalPosts,
    averageRating,
    totalRatingsGiven,
    ratingsNeededToPublish,
    hasPendingPost: !!pendingPost,
  };
}

export async function softDeleteUser(id: string) {
  await db
    .update(user)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(user.id, id));
}
```

### 5.2 Update User API Route

**File:** `app/api/users/me+api.ts` (create)

```ts
import { requireAuth } from "@/lib/auth-server";
import { getUserWithStats, updateUser } from "@/db/repositories/users";
import { z } from "zod";

export async function GET(request: Request) {
  const session = await requireAuth(request);

  const user = await getUserWithStats(session.user.id);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
}

const updateSchema = z.object({
  image: z.string().url().optional(),
});

export async function PATCH(request: Request) {
  const session = await requireAuth(request);
  const body = await request.json();

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Only allow updating image (username is set once at signup)
  if (parsed.data.image) {
    await updateUser(session.user.id, { image: parsed.data.image });
  }

  const user = await getUserWithStats(session.user.id);
  return Response.json({ user });
}
```

### 5.3 Delete Old User API Route

Delete `app/api/user+api.ts` (singular) - replaced by `app/api/users/me+api.ts`

### 5.4 Update API Client

**File:** `lib/api.ts` (update)

```ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Include cookies for session
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "API Error");
  }

  return res.json();
}

// User
export async function fetchCurrentUser() {
  return fetchAPI<{ user: User }>("/users/me");
}

export async function updateCurrentUser(data: { image?: string }) {
  return fetchAPI<{ user: User }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function checkUsernameAvailable(username: string) {
  return fetchAPI<{ available: boolean; error?: string }>(
    `/users/username-available?username=${encodeURIComponent(username)}`
  );
}

// Posts
export async function fetchMyPosts({ page = 0, search = "" }) {
  const params = new URLSearchParams({ page: String(page), search });
  return fetchAPI<{ posts: Post[]; nextPage: number | null }>(`/posts?${params}`);
}

export async function fetchPost(id: string) {
  return fetchAPI<{ post: Post }>(`/posts/${id}`);
}

export async function createPost(data: {
  title: string;
  description: string;
  price: number;
  listingUrl: string;
  imageUrl: string;
  category?: string;
}) {
  return fetchAPI<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Rating
export async function fetchPostToRate() {
  return fetchAPI<{ post: Post | null }>("/posts-to-rate");
}

export async function submitRating(data: { postId: string; rating: number }) {
  return fetchAPI<{ rating: Rating }>("/ratings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

### 5.5 Update Profile Screen

**File:** `app/profile.tsx` (update to use real data)

```tsx
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Settings, LogOut, ChevronRight } from "lucide-react-native";
import { fetchCurrentUser } from "@/lib/api";
import { signOut } from "@/lib/auth-client";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  const user = data?.user;

  return (
    <ScrollView className="flex-1 bg-background-secondary dark:bg-gray-900">
      {/* Profile Header */}
      <View className="bg-background-primary dark:bg-gray-800 p-6 items-center">
        <Image
          source={{ uri: user?.image || "https://via.placeholder.com/100" }}
          className="w-24 h-24 rounded-full bg-gray-200"
        />
        <Text className="text-2xl font-bold mt-4 text-text-primary dark:text-white">
          {user?.username || user?.name || "User"}
        </Text>
        <Text className="text-text-secondary dark:text-gray-400 mt-1">
          {user?.email}
        </Text>
      </View>

      {/* Stats */}
      <View className="bg-background-primary dark:bg-gray-800 mt-4 p-6 flex-row justify-around">
        <View className="items-center">
          <Text className="text-3xl font-bold text-text-primary dark:text-white">
            {user?.totalPosts || 0}
          </Text>
          <Text className="text-text-secondary dark:text-gray-400 mt-1">Posts</Text>
        </View>
        <View className="h-full w-px bg-border-primary dark:bg-gray-700" />
        <View className="items-center">
          <Text className="text-3xl font-bold text-text-primary dark:text-white">
            {user?.averageRating?.toFixed(1) || "—"}
          </Text>
          <Text className="text-text-secondary dark:text-gray-400 mt-1">Avg Rating</Text>
        </View>
        <View className="h-full w-px bg-border-primary dark:bg-gray-700" />
        <View className="items-center">
          <Text className="text-3xl font-bold text-text-primary dark:text-white">
            {user?.totalRatingsGiven || 0}
          </Text>
          <Text className="text-text-secondary dark:text-gray-400 mt-1">Rated</Text>
        </View>
      </View>

      {/* Pending Post Notice */}
      {user?.hasPendingPost && user?.ratingsNeededToPublish > 0 && (
        <View className="bg-yellow-50 dark:bg-yellow-900/20 mx-4 mt-4 p-4 rounded-xl">
          <Text className="text-yellow-800 dark:text-yellow-200 font-medium">
            Rate {user.ratingsNeededToPublish} more post(s) to publish your pending post!
          </Text>
        </View>
      )}

      {/* Settings */}
      <View className="bg-background-primary dark:bg-gray-800 mt-4">
        <Pressable className="flex-row items-center p-4 border-b border-border-primary dark:border-gray-700">
          <Settings color={colors.text.secondary} size={24} />
          <Text className="flex-1 ml-4 text-base text-text-primary dark:text-white">
            Settings
          </Text>
          <ChevronRight color={colors.text.tertiary} size={20} />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable
        className="bg-background-primary dark:bg-gray-800 mt-4 p-4 flex-row items-center"
        onPress={handleLogout}
      >
        <LogOut color="#ef4444" size={24} />
        <Text className="ml-4 text-base text-red-500">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}
```

---

## Deploy

```bash
git add .
git commit -m "Phase 5: User API and profile"
git push origin main
```

---

## File Structure After Phase 5

```
is-it-a-bargain/
├── db/
│   ├── repositories/
│   │   ├── posts.ts
│   │   ├── ratings.ts
│   │   └── users.ts       # NEW - User database operations
│   └── ...
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   ├── me+api.ts              # NEW - Current user API
│   │   │   └── username-available+api.ts
│   │   └── ...
│   └── profile.tsx        # UPDATED - Uses real data
├── lib/
│   └── api.ts             # UPDATED - New user functions
└── ... existing files
```

---

## Test Cases

### TC5.1: Get Current User
- [ ] Login
- [ ] GET `/api/users/me`
- [ ] Should return user with stats (totalPosts, averageRating, etc.)

### TC5.2: User Stats Accuracy
- [ ] Create 3 posts for user
- [ ] GET `/api/users/me`
- [ ] totalPosts should be 3
- [ ] Rate 5 posts
- [ ] totalRatingsGiven should be 5

### TC5.3: Average Rating Calculation
- [ ] Create a live post
- [ ] Have 3 users rate it (5, 4, 3)
- [ ] GET `/api/users/me`
- [ ] averageRating should be 4.0

### TC5.4: Update Profile Image
- [ ] PATCH `/api/users/me` with `{ "image": "https://example.com/pic.jpg" }`
- [ ] Should return updated user
- [ ] GET `/api/users/me` should show new image

### TC5.5: Ratings Needed To Publish
- [ ] Create a pending post
- [ ] GET `/api/users/me`
- [ ] ratingsNeededToPublish should be 2
- [ ] Rate 1 post
- [ ] ratingsNeededToPublish should be 1

### TC5.6: Profile Screen Displays Data
- [ ] Open profile screen in app
- [ ] Should show username, email, stats
- [ ] Should show pending post notice if applicable

### TC5.7: Logout
- [ ] Tap logout on profile screen
- [ ] Should redirect to home/login
- [ ] GET `/api/users/me` should return 401

---

## Troubleshooting

### Stats showing 0 when they shouldn't
- Check joins in getUserWithStats
- Verify posts/ratings have correct userId

### "User not found" after login
- Check session is being passed correctly
- Verify user exists in database
