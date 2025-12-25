# Is It A Bargain - Implementation Plan

## Overview

A mobile app where users post real listings (starting with used cars from Facebook Marketplace) and other users rate whether it's a good deal. Users must rate 1-2 posts before their own post goes live.

---

## Deployment Architecture

### Production Setup (Completed)

**API Server:**
- Deployed to AWS Lightsail Instance (shared with superhero-ttrpg)
- URL: https://bargain-api.callingallheroes.net
- Port: 3001
- Container: `bargain-api` (podman)
- Image: ECR `bargain-api-ecr-repo:latest`

**CI/CD Pipeline:**
- GitHub Actions workflow on push to `main`
- Builds Docker image with Expo API routes (`npx expo export -p web --no-ssg`)
- Pushes to ECR using OIDC (no access keys)
- SSH deploys to Lightsail instance
- Zero-downtime deployment with `podman run --restart unless-stopped`

**Infrastructure (CDK):**
- ECR: `BargainApiEcr` construct in `DndApplicationStack`
- IAM: `BargainApiCicdStack` with GitHub OIDC role
- DNS: Route53 A record in `DndDomainStack`
- HTTPS: Caddy reverse proxy with Let's Encrypt

**Current State:**
- All API routes use mock data (`mocks/data.ts`)
- No database yet - in-memory state
- Middleware logging enabled for request/response tracking

---

## App Inspirations

### Instagram - Post Creation Flow
- Multi-step wizard for creating content
- Each step is focused on one task
- Progress indicator showing current step
- Back navigation between steps
- Final review before publishing

### Tinder - Rating Experience
- Full-screen card showing one item at a time
- Simple action (rating instead of swipe)
- Auto-advance to next card after action
- No scrolling, focused single-item experience

### Airbnb - Profile Screen
- Clean profile header with avatar and name
- Stats summary section
- Settings list below
- Logout at bottom

---

## Coding Guidelines

### NativeWind Usage (CRITICAL)
**NativeWind v5 MUST be used for all styling. StyleSheet.create() should be avoided.**

- ✅ Use `className` prop with Tailwind classes
- ✅ NativeWind v5 supports: negative values (`-mt-8`), shadows (`shadow-lg`), flex, positioning
- ❌ Do NOT use `StyleSheet.create()` unless absolutely necessary (e.g., complex animations, platform-specific edge cases)
- ❌ Do NOT mix StyleSheet and NativeWind in the same component

**Example:**
```tsx
// ✅ CORRECT - Pure NativeWind
<View className="flex-1 justify-center items-center">
  <TouchableOpacity className="bg-green-500 rounded-full w-14 h-14 -mt-8">
    <Text className="text-white font-bold">Button</Text>
  </TouchableOpacity>
</View>

// ❌ WRONG - Using StyleSheet
const styles = StyleSheet.create({ container: { flex: 1 } });
<View style={styles.container}>...</View>
```

### Dark Mode (CRITICAL)
**All components MUST support dark mode using `dark:` classes.**

- ✅ Use `dark:` prefix for dark mode variants: `bg-white dark:bg-gray-800`
- ✅ Test in both light and dark mode
- ✅ Expo automatically follows system appearance when `userInterfaceStyle: "automatic"` is set in app.json
- ❌ Do NOT use `@apply` with dark mode variants in CSS - it doesn't work
- ✅ Use component-based approach for reusable styled elements (e.g., `Card` component, not `.card` CSS class)

**Example:**
```tsx
// ✅ CORRECT - Dark mode support in components
<View className="bg-white dark:bg-gray-800">
  <Text className="text-gray-900 dark:text-white">Title</Text>
  <Text className="text-gray-600 dark:text-gray-400">Description</Text>
</View>

// ✅ CORRECT - Reusable Card component with dark mode
export function Card({ className = "", ...props }: ViewProps) {
  return (
    <View
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${className}`}
      {...props}
    />
  );
}

// ✅ CORRECT - Dark mode for navigation (tab bar, headers)
import { useColorScheme } from "react-native";

const colorScheme = useColorScheme();
const isDark = colorScheme === "dark";

<Tabs
  screenOptions={{
    tabBarStyle: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderTopColor: isDark ? "#374151" : "#e5e7eb",
    },
    headerStyle: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
    },
    headerTintColor: isDark ? "#ffffff" : "#000000",
  }}
>

// ❌ WRONG - CSS @apply with dark mode (doesn't work)
@layer components {
  .card {
    @apply bg-white dark:bg-gray-800; /* dark: won't work in @apply */
  }
}
```

### Semantic Tokens (CRITICAL)
**Use semantic naming for colors and design tokens. Never use color names directly.**

Based on industry best practices (Reddit r/reactjs consensus):
- ✅ Name by USAGE: `primary`, `text-primary`, `background-secondary`
- ❌ Never use color names: `green-500`, `blue-600`, `red-400`

**Why?** If you decide to change your primary color from green to blue, you only change it once in `theme/colors.js`, not in 100+ components.

**File Structure:**
```
theme/
├── colors.js          # Source of truth (CommonJS for tailwind.config.js)
└── colors.ts          # Re-exports for TypeScript app code

tailwind.config.js     # Extends Tailwind with semantic tokens from colors.js

metro.config.js        # Connects NativeWind to tailwind.config.js

global.css             # Component classes (.card, .btn-primary, .badge-pending)
                       # NOTE: @apply only works with default Tailwind classes
```

**Three-Layer System:**
1. **Base Palette** (in `theme/colors.js`) - Raw colors, rarely used directly
2. **Semantic Tokens** (in `tailwind.config.js`) - Map to base colors, USE THESE in className
3. **Component Classes** (in `global.css`) - Reusable patterns

**Usage in Components:**

```tsx
// ✅ CORRECT - Semantic tokens via className
<View className="bg-background-primary">
  <Text className="text-text-primary">Title</Text>
  <Text className="text-text-secondary">Subtitle</Text>
  <TouchableOpacity className="bg-primary">
    <Text className="text-text-inverse">Submit</Text>
  </TouchableOpacity>
</View>

// ✅ CORRECT - For icons/props that need raw values
import { colors } from "@/theme/colors";
<User color={colors.primary.DEFAULT} size={24} />

// ✅ CORRECT - Component classes from global.css
<View className="card">
  <TouchableOpacity className="btn-primary">...</TouchableOpacity>
</View>

// ⚠️ EXCEPTION - Use default Tailwind for complex components (e.g., CreateTabButton)
// when custom tokens don't apply correctly
<TouchableOpacity className="bg-green-500 rounded-full">...</TouchableOpacity>

// ❌ WRONG - Direct Tailwind colors in regular components
<View className="bg-green-500">
  <Text className="text-gray-900">Title</Text>
</View>
```

**Available Semantic Tokens:**
| Token | Usage |
|-------|-------|
| `primary` | Brand color (buttons, icons, links) |
| `secondary` | Neutral/muted elements |
| `text-primary` | Main text |
| `text-secondary` | Secondary/muted text |
| `text-tertiary` | Hints, placeholders |
| `text-inverse` | Text on dark backgrounds |
| `background-primary` | Main background (white) |
| `background-secondary` | Subtle background |
| `border-primary` | Default borders |
| `status-pending-bg/text` | Pending badge |
| `status-live-bg/text` | Live badge |
| `status-rated-bg/text` | Rated badge |
| `success`, `warning`, `danger`, `info` | Feedback colors |

**Known Limitations:**
- `@apply` in `global.css` only works with default Tailwind classes, not custom tokens
- Some complex components (like elevated tab buttons) may need default Tailwind classes

### Key Learnings from Implementation

**Phase 1 & 2 Learnings:**
1. **Component over CSS classes** - Use `<Card>` component instead of `.card` CSS class for dark mode support
2. **useTransition for search** - Prevents flickering when filtering lists
3. **keepPreviousData** - Shows old data while fetching new data (smooth UX)
4. **Dark mode navigation** - Tab bars and headers need `useColorScheme()` from React Native, not NativeWind
5. **FlashList optimization** - Use `removeClippedSubviews={false}` to disable animations, `keyExtractor` for stable keys
6. **Search UX** - Icon on left, cancel button on focus, blur on cancel, scroll to top on search change

**Phase 3 Learnings:**
1. **Star rating widget fires multiple onChange** - Don't auto-submit on star selection; use separate Submit button
2. **Reset state on card change** - Use `key={post.id}` on RatingCard to reset rating state when post changes
3. **Dynamic className with semantic tokens breaks dark mode** - Use default Tailwind colors (e.g., `bg-green-500`) for dynamic classes

**Phase 4 Learnings:**
1. **iOS TextInput vertical alignment bug** - Text appears at bottom instead of center. Fix: `style={{ lineHeight: 0 }}`
2. **Zod error API** - Use `result.error.issues` not `result.error.errors`
3. **Safe area insets** - Use NativeWind's `mb-safe-or-8` class instead of `useSafeAreaInsets()` hook
4. **Cancel button for create flow** - Add Cancel button on first step only; other steps use default back arrow
5. **Button styling** - Use `rounded-2xl`, `w-4/5`, `self-center`, `mb-safe-or-8` for bottom buttons

**Phase 5 Learnings:**
1. **Link with asChild breaks NativeWind** - `<Link asChild>` strips className styles from child components. Use `useRouter()` instead for navigation with styled components.

---

## Route Structure

```
app/
├── _layout.tsx                    # Root stack navigator
├── (tabs)/
│   ├── _layout.tsx                # Bottom tab navigator (3 tabs: Home, +, Rate)
│   ├── index.tsx                  # Home - user's posts (with profile button in header)
│   ├── rate.tsx                   # Rate other posts
│   └── create-placeholder.tsx     # Dummy file for + button tab slot
├── profile.tsx                    # User profile (accessed from home header)
├── create/
│   ├── _layout.tsx                # Create flow stack
│   ├── index.tsx                  # Step 1: Title & Description
│   ├── price.tsx                  # Step 2: Price
│   └── review.tsx                 # Step 3: Review & Submit
├── post-created.tsx               # Success screen after creation
└── post/
    └── [id].tsx                   # View single post detail
```

**Key Changes from Original Plan:**
- Profile is NO LONGER a tab - it's a separate screen accessed via header button
- Only 3 tabs now: Home, + (center), Rate
- This ensures the + button is perfectly centered

---

## Phase 1: Navigation & Layout Setup

### 1.1 Root Layout
File: `app/_layout.tsx`

```tsx
import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="create/index" 
        options={{ presentation: "modal", headerShown: true, title: "Create Post" }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ headerShown: true, title: "Profile" }} 
      />
    </Stack>
  );
}
```

### 1.2 Tab Layout with Center + Button
File: `app/(tabs)/_layout.tsx`

Requirements:
- 3 tabs: Home, + (center), Rate
- Center + button (elevated, different style)
- + button navigates to create flow
- Haptic feedback on tab press
- Profile removed from tabs (accessed via home header button)

```tsx
import { Tabs } from "expo-router";
import { Home, Star } from "lucide-react-native";
import { CreateTabButton } from "@/components/CreateTabButton";
import { HapticTab } from "@/components/HapticTab";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#6b7280",
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Posts",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create-placeholder"
        options={{
          tabBarButton: () => <CreateTabButton />,
        }}
      />
      <Tabs.Screen
        name="rate"
        options={{
          title: "Rate",
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

### 1.3 Create Tab Button Component
File: `components/CreateTabButton.tsx`

Requirements:
- Elevated circular button
- Plus icon
- Navigates to /create
- Haptic feedback on press
- **Pure NativeWind styling (no StyleSheet)**

```tsx
import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export function CreateTabButton() {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/create");
  };

  return (
    <View className="flex-1 justify-center items-center">
      <TouchableOpacity
        className="bg-green-500 rounded-full w-14 h-14 items-center justify-center shadow-lg -mt-8"
        onPress={handlePress}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
}
```

### 1.4 Create Placeholder Tab File
File: `app/(tabs)/create-placeholder.tsx`

This dummy file satisfies the tab bar requirement for the + button slot.

```tsx
// This file exists only to satisfy the tab bar
// The actual create flow is at /create
export default function CreatePlaceholder() {
  return null;
}
```

### 1.5 Home Screen with Profile Button
File: `app/(tabs)/index.tsx`

```tsx
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { Stack } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Posts",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="mr-4"
            >
              <User className="text-green-500" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-2xl font-bold text-gray-900">My Posts</Text>
        <Text className="text-gray-500 mt-2">Home screen placeholder</Text>
      </View>
    </>
  );
}
```

### 1.6 Profile Screen
File: `app/profile.tsx`

```tsx
import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      <Text className="text-gray-500 mt-2">Profile screen placeholder</Text>
    </View>
  );
}
```

**Common Issues & Solutions:**
- ❌ BlurView errors on iOS: Remove BlurView temporarily, rebuild with `npx expo prebuild --clean`
- ❌ Route warnings: Ensure all Stack.Screen names match actual file paths (e.g., `create/index` not `create`)
- ❌ Off-center + button: Use 3 tabs (odd number) so center tab is truly centered
- ❌ Old index.tsx conflicts: Remove `app/index.tsx` if it exists (use `app/(tabs)/index.tsx` instead)

---

## Phase 2: Home Screen (User's Posts)

### 2.0 Card Component (Reusable)
File: `components/Card.tsx`

**Why a component instead of CSS class?**
- `@apply` in CSS doesn't support dark mode variants
- Component-based approach allows dark mode to work properly
- Reusable across the app

```tsx
import { View, ViewProps } from "react-native";

export function Card({ className = "", ...props }: ViewProps) {
  return (
    <View
      className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
      {...props}
    />
  );
}
```

### 2.1 Home Screen
File: `app/(tabs)/index.tsx`

Requirements:
- Search bar with icon, cancel button, focus state
- Infinite scroll list using FlashList
- Shows only current user's posts
- Pull to refresh
- Empty state when no posts
- Dark mode support
- Smooth search with useTransition (no flickering)

```tsx
import { useState, useTransition, useRef, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { User } from "lucide-react-native";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { fetchMyPosts } from "@/lib/api";
import { colors } from "@/theme/colors";

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<FlashList<any>>(null);

  const { data, fetchNextPage, hasNextPage, refetch, isRefetching } = 
    useInfiniteQuery({
      queryKey: ["my-posts", search],
      queryFn: ({ pageParam }) => fetchMyPosts({ page: pageParam, search }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
      placeholderData: keepPreviousData,
    });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // Scroll to top when search changes
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [search]);

  const handleSearchChange = (text: string) => {
    startTransition(() => {
      setSearch(text);
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Posts",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="mr-4"
            >
              <User color={colors.primary.DEFAULT} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-background-primary dark:bg-gray-900">
        <View className="mx-4 mt-4 mb-2">
          <SearchBar
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search your posts..."
          />
        </View>
        <FlashList
          ref={listRef}
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          estimatedItemSize={150}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={posts.length === 0 && !isRefetching ? <EmptyState /> : null}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={false}
        />
      </View>
    </>
  );
}
```

### 2.2 SearchBar Component
File: `components/SearchBar.tsx`

Requirements:
- Search icon on left
- Cancel button (X) appears on focus
- Blur input when cancel pressed
- Dark mode support
- No black outline on web

```tsx
import { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, Platform } from "react-native";
import { Search, X } from "lucide-react-native";
import { colors } from "@/theme/colors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = "Search..." }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleCancel = () => {
    onChangeText("");
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <View className="flex-row items-center">
      <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700">
        <Search color={colors.text.tertiary} size={20} />
        <TextInput
          ref={inputRef}
          className="flex-1 text-base text-text-primary dark:text-white"
          style={[
            { paddingLeft: 8 },
            Platform.OS === "web" ? { outlineStyle: "none" } : undefined
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !value && setIsFocused(false)}
        />
      </View>
      {isFocused && (
        <TouchableOpacity onPress={handleCancel} className="ml-2 px-2">
          <X color={colors.text.secondary} size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### 2.3 Post Card Component
File: `components/PostCard.tsx`

Requirements:
- Title, description (truncated), price
- Average rating with stars
- Number of ratings
- Time posted (relative: "2h ago")
- Status badge (Pending/Live/Rated)
- Tappable → navigates to post detail

```tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { StarRatingDisplay } from "react-native-star-rating-widget";
import { StatusBadge } from "./StatusBadge";
import { formatRelativeTime } from "@/utils/date";

type Post = {
  id: string;
  title: string;
  description: string;
  price: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  status: "pending" | "live" | "rated";
};

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  return (
    <Pressable
      className="mx-4 my-2 p-4 bg-white rounded-xl border border-gray-200"
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-lg font-semibold flex-1">{post.title}</Text>
        <StatusBadge status={post.status} />
      </View>
      
      <Text className="text-gray-600 mt-1" numberOfLines={2}>
        {post.description}
      </Text>
      
      <Text className="text-xl font-bold text-green-600 mt-2">
        ${post.price.toLocaleString()}
      </Text>
      
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <StarRatingDisplay rating={post.averageRating} starSize={16} />
          <Text className="text-gray-500 ml-2">({post.ratingCount})</Text>
        </View>
        <Text className="text-gray-400 text-sm">
          {formatRelativeTime(post.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}
```

### 2.3 Status Badge Component
File: `components/StatusBadge.tsx`

```tsx
import { View, Text } from "react-native";

const statusConfig = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  live: { bg: "bg-green-100", text: "text-green-800", label: "Live" },
  rated: { bg: "bg-blue-100", text: "text-blue-800", label: "Rated" },
};

export function StatusBadge({ status }: { status: "pending" | "live" | "rated" }) {
  const config = statusConfig[status];
  return (
    <View className={`px-2 py-1 rounded-full ${config.bg}`}>
      <Text className={`text-xs font-medium ${config.text}`}>{config.label}</Text>
    </View>
  );
}
```

---

## Phase 3: Rate Screen (Tinder-style)

### 3.1 Rate Screen
File: `app/(tabs)/rate.tsx`

Requirements:
- Full-screen card showing one post at a time
- Post details: title, description, price
- 5-star rating input with labels ("Bad Deal" to "Bargain!")
- After rating, auto-advance to next post
- Empty state when no posts to rate
- Skip button (optional, for later)

Inspiration: **Tinder** - focused single-card experience, no scrolling

```tsx
import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RatingCard } from "@/components/RatingCard";

export default function RateScreen() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts-to-rate"],
    queryFn: fetchPostsToRate,
  });

  const rateMutation = useMutation({
    mutationFn: submitRating,
    onSuccess: () => {
      setCurrentIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentPost = posts?.[currentIndex];

  if (!currentPost) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-2xl font-bold text-center">🎉</Text>
        <Text className="text-xl font-semibold mt-4 text-center">
          All caught up!
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          No more posts to rate right now. Check back later!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <RatingCard
        post={currentPost}
        onRate={(rating) => rateMutation.mutate({ postId: currentPost.id, rating })}
        isSubmitting={rateMutation.isPending}
      />
    </View>
  );
}
```

### 3.2 Rating Card Component
File: `components/RatingCard.tsx`

Requirements:
- Full-screen card layout
- Post title, description, price prominently displayed
- Star rating with semantic labels
- Submit happens on star selection
- Loading state while submitting

```tsx
import { View, Text } from "react-native";
import StarRating from "react-native-star-rating-widget";

type Post = {
  id: string;
  title: string;
  description: string;
  price: number;
};

type Props = {
  post: Post;
  onRate: (rating: number) => void;
  isSubmitting: boolean;
};

const ratingLabels = ["", "Bad Deal", "Below Average", "Fair", "Good Deal", "Bargain!"];

export function RatingCard({ post, onRate, isSubmitting }: Props) {
  const handleRating = (rating: number) => {
    if (!isSubmitting) {
      onRate(rating);
    }
  };

  return (
    <View className="flex-1 m-4 bg-white rounded-2xl shadow-lg p-6 justify-between">
      {/* Post Details */}
      <View>
        <Text className="text-2xl font-bold">{post.title}</Text>
        <Text className="text-gray-600 mt-3 text-base leading-6">
          {post.description}
        </Text>
        <Text className="text-3xl font-bold text-green-600 mt-6">
          ${post.price.toLocaleString()}
        </Text>
      </View>

      {/* Rating Section */}
      <View className="items-center pb-8">
        <Text className="text-lg font-medium text-gray-700 mb-4">
          Is this a good deal?
        </Text>
        <StarRating
          rating={0}
          onChange={handleRating}
          starSize={48}
          enableHalfStar={false}
          color="#10b981"
          emptyColor="#d1d5db"
        />
        <View className="flex-row justify-between w-full mt-3 px-2">
          <Text className="text-sm text-gray-400">Bad Deal</Text>
          <Text className="text-sm text-gray-400">Bargain!</Text>
        </View>
        {isSubmitting && (
          <Text className="text-gray-500 mt-4">Submitting...</Text>
        )}
      </View>
    </View>
  );
}
```

---

## Phase 4: Create Post Flow (Instagram-style)

### 4.1 Create Flow Layout
File: `app/create/_layout.tsx`

Requirements:
- Stack navigator for steps
- Header with back button and step indicator
- Shared state across steps using Zustand

Inspiration: **Instagram** - multi-step wizard, focused inputs per step

```tsx
import { Stack } from "expo-router";

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: "New Post - Details" }} 
      />
      <Stack.Screen 
        name="price" 
        options={{ title: "New Post - Price" }} 
      />
      <Stack.Screen 
        name="review" 
        options={{ title: "Review Post" }} 
      />
    </Stack>
  );
}
```

### 4.2 Create Post Store (Zustand)
File: `stores/createPostStore.ts`

```tsx
import { create } from "zustand";

type CreatePostData = {
  title: string;
  description: string;
  price: string;
};

type CreatePostStore = CreatePostData & {
  errors: Record<string, string>;
  updateData: (updates: Partial<CreatePostData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetData: () => void;
};

const initialData: CreatePostData = {
  title: "",
  description: "",
  price: "",
};

export const useCreatePostStore = create<CreatePostStore>((set) => ({
  ...initialData,
  errors: {},
  updateData: (updates) => set((state) => ({ ...state, ...updates })),
  setErrors: (errors) => set({ errors }),
  resetData: () => set({ ...initialData, errors: {} }),
}));
```

### 4.3 Step 1: Title & Description
File: `app/create/index.tsx`

```tsx
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { createPostStep1Schema } from "@/schemas/post";

export default function CreateStep1() {
  const router = useRouter();
  const { title, description, updateData, errors, setErrors } = useCreatePostStore();

  const validate = () => {
    const result = createPostStep1Schema.safeParse({ title, description });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleContinue = () => {
    if (validate()) {
      router.push("/create/price");
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">Title</Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base ${errors.title ? "border-red-500" : "border-gray-300"}`}
        placeholder="e.g., 2019 Honda Civic"
        value={title}
        onChangeText={(text) => updateData({ title: text })}
        maxLength={100}
      />
      {errors.title && <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>}
      <Text className="text-gray-400 text-xs mt-1">{title.length}/100</Text>

      <Text className="text-sm font-medium text-gray-700 mb-2 mt-6">Description</Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base h-32 ${errors.description ? "border-red-500" : "border-gray-300"}`}
        placeholder="Describe the listing..."
        value={description}
        onChangeText={(text) => updateData({ description: text })}
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />
      {errors.description && <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>}
      <Text className="text-gray-400 text-xs mt-1">{description.length}/1000</Text>

      <View className="flex-1" />

      <Pressable
        className="py-4 rounded-lg bg-green-500"
        onPress={handleContinue}
      >
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}
```

### 4.4 Step 2: Price
File: `app/create/price.tsx`

```tsx
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { createPostStep2Schema } from "@/schemas/post";

export default function CreateStep2() {
  const router = useRouter();
  const { price, updateData, errors, setErrors } = useCreatePostStore();

  const validate = () => {
    const result = createPostStep2Schema.safeParse({ price });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleContinue = () => {
    if (validate()) {
      router.push("/create/review");
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">Listing Price</Text>
      <View className={`flex-row items-center border rounded-lg px-4 ${errors.price ? "border-red-500" : "border-gray-300"}`}>
        <Text className="text-xl text-gray-500">$</Text>
        <TextInput
          className="flex-1 py-3 px-2 text-2xl"
          placeholder="0"
          value={price}
          onChangeText={(text) => updateData({ price: text.replace(/[^0-9]/g, "") })}
          keyboardType="numeric"
        />
      </View>
      {errors.price && <Text className="text-red-500 text-sm mt-1">{errors.price}</Text>}

      <View className="flex-1" />

      <Pressable
        className="py-4 rounded-lg bg-green-500"
        onPress={handleContinue}
      >
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}
```

### 4.5 Step 3: Review & Submit
File: `app/create/review.tsx`

```tsx
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useCreatePostStore } from "@/stores/createPostStore";

export default function CreateStep3() {
  const router = useRouter();
  const { title, description, price, resetData } = useCreatePostStore();

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      resetData();
      router.replace("/post-created");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create post. Please try again.");
    },
  });

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-lg font-semibold text-gray-500 mb-1">Title</Text>
      <Text className="text-xl font-bold">{title}</Text>

      <Text className="text-lg font-semibold text-gray-500 mb-1 mt-6">Description</Text>
      <Text className="text-base text-gray-700">{description}</Text>

      <Text className="text-lg font-semibold text-gray-500 mb-1 mt-6">Price</Text>
      <Text className="text-3xl font-bold text-green-600">
        ${Number(price).toLocaleString()}
      </Text>

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-lg ${createMutation.isPending ? "bg-gray-400" : "bg-green-500"}`}
        onPress={() => createMutation.mutate({ title, description, price: Number(price) })}
        disabled={createMutation.isPending}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {createMutation.isPending ? "Creating..." : "Create Post"}
        </Text>
      </Pressable>
    </View>
  );
}
```

---

## Phase 5: Post Created Screen

### 5.1 Post Created Screen
File: `app/post-created.tsx`

Requirements:
- Success message explaining post is created but not published
- Explains user needs to rate other posts first
- "Go to Rate" button → navigates to rate tab
- "Later" button → navigates to home tab

```tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";

export default function PostCreatedScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white p-6 justify-center items-center">
      <CheckCircle color="#10b981" size={80} />
      
      <Text className="text-2xl font-bold mt-6 text-center">
        Post Created!
      </Text>
      
      <Text className="text-gray-600 mt-4 text-center text-base leading-6">
        Your post has been created, but it won't be published until you rate other posts first.
      </Text>
      
      <Text className="text-gray-500 mt-2 text-center text-sm">
        Rate at least 2 posts to publish yours.
      </Text>

      <Pressable
        className="bg-green-500 py-4 px-8 rounded-lg mt-8 w-full"
        onPress={() => router.replace("/(tabs)/rate")}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Go to Rate Posts
        </Text>
      </Pressable>

      <Pressable
        className="py-4 px-8 mt-4"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-gray-500 text-center font-medium">
          Later
        </Text>
      </Pressable>
    </View>
  );
}
```

---

## Phase 6: Profile Screen (Airbnb-style)

### 6.1 Profile Screen
File: `app/profile.tsx` (NOT in tabs - accessed via home header button)

Requirements:
- Profile picture (avatar)
- Nickname/display name
- Stats summary: total posts, average rating received
- Settings section
- Logout button

Inspiration: **Airbnb** - clean header, stats, settings list

```tsx
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Settings, LogOut, ChevronRight } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white p-6 items-center">
        <Image
          source={{ uri: user?.avatarUrl || "https://via.placeholder.com/100" }}
          className="w-24 h-24 rounded-full bg-gray-200"
        />
        <Text className="text-2xl font-bold mt-4">{user?.nickname || "User"}</Text>
      </View>

      {/* Stats */}
      <View className="bg-white mt-4 p-6 flex-row justify-around">
        <View className="items-center">
          <Text className="text-3xl font-bold">{user?.totalPosts || 0}</Text>
          <Text className="text-gray-500 mt-1">Posts</Text>
        </View>
        <View className="h-full w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-3xl font-bold">
            {user?.averageRating?.toFixed(1) || "—"}
          </Text>
          <Text className="text-gray-500 mt-1">Avg Rating</Text>
        </View>
        <View className="h-full w-px bg-gray-200" />
        <View className="items-center">
          <Text className="text-3xl font-bold">{user?.totalRatingsGiven || 0}</Text>
          <Text className="text-gray-500 mt-1">Rated</Text>
        </View>
      </View>

      {/* Settings */}
      <View className="bg-white mt-4">
        <Pressable className="flex-row items-center p-4 border-b border-gray-100">
          <Settings color="#6b7280" size={24} />
          <Text className="flex-1 ml-4 text-base">Settings</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable
        className="bg-white mt-4 p-4 flex-row items-center"
        onPress={logout}
      >
        <LogOut color="#ef4444" size={24} />
        <Text className="ml-4 text-base text-red-500">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}
```

---

## Phase 7: Post Detail Screen

### 7.1 Post Detail Screen
File: `app/post/[id].tsx`

Requirements:
- Full post details
- Status badge
- If status is "rated": show rating summary/breakdown
- Rating distribution (how many 1-star, 2-star, etc.)

```tsx
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StarRatingDisplay } from "react-native-star-rating-widget";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingBreakdown } from "@/components/RatingBreakdown";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchPost(id),
  });

  if (isLoading || !post) {
    return <View className="flex-1 items-center justify-center"><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-2xl font-bold flex-1">{post.title}</Text>
        <StatusBadge status={post.status} />
      </View>

      <Text className="text-gray-600 mt-4 text-base leading-6">
        {post.description}
      </Text>

      <Text className="text-3xl font-bold text-green-600 mt-6">
        ${post.price.toLocaleString()}
      </Text>

      {/* Rating Summary */}
      <View className="mt-8 p-4 bg-gray-50 rounded-xl">
        <Text className="text-lg font-semibold mb-3">Rating Summary</Text>
        
        <View className="flex-row items-center">
          <Text className="text-4xl font-bold">{post.averageRating.toFixed(1)}</Text>
          <View className="ml-4">
            <StarRatingDisplay rating={post.averageRating} starSize={24} />
            <Text className="text-gray-500 mt-1">{post.ratingCount} ratings</Text>
          </View>
        </View>

        {/* Show breakdown only for rated posts */}
        {post.status === "rated" && post.ratingBreakdown && (
          <RatingBreakdown breakdown={post.ratingBreakdown} total={post.ratingCount} />
        )}
      </View>

      {/* Pending notice */}
      {post.status === "pending" && (
        <View className="mt-6 p-4 bg-yellow-50 rounded-xl">
          <Text className="text-yellow-800 font-medium">
            This post is pending. Rate other posts to publish it!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
```

### 7.2 Rating Breakdown Component
File: `components/RatingBreakdown.tsx`

```tsx
import { View, Text } from "react-native";

type Props = {
  breakdown: { [key: number]: number }; // { 1: 5, 2: 10, 3: 20, 4: 30, 5: 35 }
  total: number;
};

const labels = ["", "Bad Deal", "Below Avg", "Fair", "Good Deal", "Bargain!"];

export function RatingBreakdown({ breakdown, total }: Props) {
  return (
    <View className="mt-4">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <View key={star} className="flex-row items-center mb-2">
            <Text className="w-20 text-sm text-gray-600">{labels[star]}</Text>
            <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
              <View
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </View>
            <Text className="w-8 text-sm text-gray-500 text-right">{count}</Text>
          </View>
        );
      })}
    </View>
  );
}
```

---

## Phase 10: API Routes (Expo Router API)

API Routes are server endpoints defined with `+api.ts` suffix in the app directory. They run on a server and can handle sensitive data securely.

### 10.1 Enable Server Output
File: `app.json`

```json
{
  "expo": {
    "web": {
      "output": "server",
      "bundler": "metro"
    }
  }
}
```

### 10.2 API Route Structure

```
app/
├── api/
│   ├── posts+api.ts           # GET (list user's posts), POST (create post)
│   ├── posts/
│   │   └── [id]+api.ts        # GET (single post), PATCH (update status)
│   ├── posts-to-rate+api.ts   # GET (posts available to rate)
│   ├── ratings+api.ts         # POST (submit rating)
│   └── user+api.ts            # GET (current user profile)
```

### 10.3 Posts API
File: `app/api/posts+api.ts`

```ts
// GET /api/posts - List current user's posts
// POST /api/posts - Create a new post

import { mockPosts, mockUsers } from "@/mocks/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "0");
  const limit = 10;

  // TODO: Get userId from auth session
  const userId = "user-1";

  let posts = mockPosts.filter((p) => p.userId === userId);

  if (search) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = page * limit;
  const paginatedPosts = posts.slice(start, start + limit);
  const hasMore = start + limit < posts.length;

  return Response.json({
    posts: paginatedPosts,
    nextPage: hasMore ? page + 1 : null,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, price } = body;

  // TODO: Get userId from auth session
  const userId = "user-1";
  const user = mockUsers.find((u) => u.id === userId);

  // Check if user already has a pending post
  if (user?.pendingPostId) {
    return Response.json(
      { error: "You already have a pending post. Rate others to publish it." },
      { status: 400 }
    );
  }

  const newPost = {
    id: `post-${Date.now()}`,
    userId,
    title,
    description,
    price,
    status: "pending" as const,
    averageRating: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // TODO: Save to database
  mockPosts.push(newPost);

  // Update user's pending post
  if (user) {
    user.pendingPostId = newPost.id;
    user.ratingsNeededToPublish = 2;
  }

  return Response.json({ post: newPost }, { status: 201 });
}
```

### 10.4 Single Post API
File: `app/api/posts/[id]+api.ts`

```ts
// GET /api/posts/:id - Get single post
// PATCH /api/posts/:id - Update post (status change)

import { mockPosts } from "@/mocks/data";

export async function GET(request: Request, { id }: { id: string }) {
  const post = mockPosts.find((p) => p.id === id);

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json({ post });
}

export async function PATCH(request: Request, { id }: { id: string }) {
  const body = await request.json();
  const post = mockPosts.find((p) => p.id === id);

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Update allowed fields
  if (body.status) {
    post.status = body.status;
  }

  post.updatedAt = new Date().toISOString();

  return Response.json({ post });
}
```

### 10.5 Posts to Rate API
File: `app/api/posts-to-rate+api.ts`

```ts
// GET /api/posts-to-rate - Get posts available for current user to rate

import { mockPosts, mockRatings } from "@/mocks/data";

export async function GET(request: Request) {
  // TODO: Get userId from auth session
  const userId = "user-1";

  // Get IDs of posts user has already rated
  const ratedPostIds = mockRatings
    .filter((r) => r.userId === userId)
    .map((r) => r.postId);

  // Get live posts from other users that haven't been rated
  const postsToRate = mockPosts.filter(
    (p) =>
      p.userId !== userId &&
      p.status === "live" &&
      !ratedPostIds.includes(p.id)
  );

  return Response.json({ posts: postsToRate });
}
```

### 10.6 Ratings API
File: `app/api/ratings+api.ts`

```ts
// POST /api/ratings - Submit a rating

import { mockPosts, mockRatings, mockUsers } from "@/mocks/data";

export async function POST(request: Request) {
  const body = await request.json();
  const { postId, rating } = body;

  // TODO: Get userId from auth session
  const userId = "user-1";

  // Validate rating
  if (rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const post = mockPosts.find((p) => p.id === postId);
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Can't rate own post
  if (post.userId === userId) {
    return Response.json({ error: "Cannot rate your own post" }, { status: 400 });
  }

  // Check if already rated
  const existingRating = mockRatings.find(
    (r) => r.postId === postId && r.userId === userId
  );
  if (existingRating) {
    return Response.json({ error: "Already rated this post" }, { status: 400 });
  }

  // Create rating
  const newRating = {
    id: `rating-${Date.now()}`,
    postId,
    userId,
    rating,
    createdAt: new Date().toISOString(),
  };
  mockRatings.push(newRating);

  // Update post's average rating
  const postRatings = mockRatings.filter((r) => r.postId === postId);
  const avgRating =
    postRatings.reduce((sum, r) => sum + r.rating, 0) / postRatings.length;
  post.averageRating = Math.round(avgRating * 10) / 10;
  post.ratingCount = postRatings.length;

  // Update post status if enough ratings
  if (post.ratingCount >= 5 && post.status === "live") {
    post.status = "rated";
  }

  // Check if user's pending post should be published
  const user = mockUsers.find((u) => u.id === userId);
  if (user && user.pendingPostId && user.ratingsNeededToPublish > 0) {
    user.ratingsNeededToPublish--;
    user.totalRatingsGiven++;

    if (user.ratingsNeededToPublish === 0) {
      // Publish the pending post
      const pendingPost = mockPosts.find((p) => p.id === user.pendingPostId);
      if (pendingPost) {
        pendingPost.status = "live";
      }
      user.pendingPostId = undefined;
    }
  }

  return Response.json({ rating: newRating }, { status: 201 });
}
```

### 10.7 User API
File: `app/api/user+api.ts`

```ts
// GET /api/user - Get current user profile

import { mockUsers, mockPosts, mockRatings } from "@/mocks/data";

export async function GET(request: Request) {
  // TODO: Get userId from auth session
  const userId = "user-1";

  const user = mockUsers.find((u) => u.id === userId);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate stats
  const userPosts = mockPosts.filter((p) => p.userId === userId);
  const totalPosts = userPosts.length;
  const ratedPosts = userPosts.filter((p) => p.ratingCount > 0);
  const averageRating =
    ratedPosts.length > 0
      ? ratedPosts.reduce((sum, p) => sum + p.averageRating, 0) / ratedPosts.length
      : 0;

  return Response.json({
    user: {
      ...user,
      totalPosts,
      averageRating: Math.round(averageRating * 10) / 10,
    },
  });
}
```

### 10.8 Mock Data
File: `mocks/data.ts`

```ts
import { Post, Rating, User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "user-1",
    nickname: "CarHunter",
    avatarUrl: "https://i.pravatar.cc/150?u=user1",
    totalPosts: 3,
    averageRating: 4.2,
    totalRatingsGiven: 5,
    pendingPostId: undefined,
    ratingsNeededToPublish: 0,
  },
  {
    id: "user-2",
    nickname: "DealFinder",
    avatarUrl: "https://i.pravatar.cc/150?u=user2",
    totalPosts: 2,
    averageRating: 3.8,
    totalRatingsGiven: 8,
    pendingPostId: undefined,
    ratingsNeededToPublish: 0,
  },
];

export const mockPosts: Post[] = [
  {
    id: "post-1",
    userId: "user-1",
    title: "2019 Honda Civic LX",
    description: "Clean title, one owner, 45k miles. Regular maintenance done at dealer. No accidents.",
    price: 18500,
    status: "rated",
    averageRating: 4.2,
    ratingCount: 12,
    ratingBreakdown: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 5 },
    createdAt: "2024-11-28T10:00:00Z",
    updatedAt: "2024-11-28T10:00:00Z",
  },
  {
    id: "post-2",
    userId: "user-1",
    title: "2020 Toyota Camry SE",
    description: "Excellent condition, 32k miles. Leather seats, sunroof, backup camera.",
    price: 24000,
    status: "live",
    averageRating: 3.5,
    ratingCount: 4,
    createdAt: "2024-11-27T15:30:00Z",
    updatedAt: "2024-11-27T15:30:00Z",
  },
  {
    id: "post-3",
    userId: "user-1",
    title: "2018 Ford F-150 XLT",
    description: "4x4, crew cab, 60k miles. Tow package included. Minor scratches on tailgate.",
    price: 32000,
    status: "pending",
    averageRating: 0,
    ratingCount: 0,
    createdAt: "2024-11-29T08:00:00Z",
    updatedAt: "2024-11-29T08:00:00Z",
  },
  {
    id: "post-4",
    userId: "user-2",
    title: "2017 BMW 3 Series",
    description: "Sport package, 55k miles. New tires, recently serviced. Salvage title.",
    price: 19500,
    status: "live",
    averageRating: 2.8,
    ratingCount: 6,
    createdAt: "2024-11-26T12:00:00Z",
    updatedAt: "2024-11-26T12:00:00Z",
  },
  {
    id: "post-5",
    userId: "user-2",
    title: "2021 Mazda CX-5 Touring",
    description: "Like new, 18k miles. Full warranty remaining. All-wheel drive.",
    price: 28500,
    status: "live",
    averageRating: 4.6,
    ratingCount: 8,
    createdAt: "2024-11-25T09:00:00Z",
    updatedAt: "2024-11-25T09:00:00Z",
  },
];

export const mockRatings: Rating[] = [
  { id: "rating-1", postId: "post-1", userId: "user-2", rating: 4, createdAt: "2024-11-28T11:00:00Z" },
  { id: "rating-2", postId: "post-1", userId: "user-3", rating: 5, createdAt: "2024-11-28T12:00:00Z" },
];
```

---

## Phase 11: API Client Functions

### 11.1 API Client
File: `lib/api.ts`

```ts
const API_BASE = "/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "API Error");
  }

  return res.json();
}

// Posts
export async function fetchMyPosts({ page = 0, search = "" }) {
  const params = new URLSearchParams({ page: String(page), search });
  return fetchAPI<{ posts: Post[]; nextPage: number | null }>(`/posts?${params}`);
}

export async function fetchPost(id: string) {
  return fetchAPI<{ post: Post }>(`/posts/${id}`);
}

export async function createPost(data: { title: string; description: string; price: number }) {
  return fetchAPI<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Rating
export async function fetchPostsToRate() {
  return fetchAPI<{ posts: Post[] }>("/posts-to-rate");
}

export async function submitRating(data: { postId: string; rating: number }) {
  return fetchAPI<{ rating: Rating }>("/ratings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// User
export async function fetchUser() {
  return fetchAPI<{ user: User }>("/user");
}
```

---

## Phase 8: Validation & Types

### 8.1 Zod Schemas
File: `schemas/post.ts`

```ts
import { z } from "zod";

export const createPostStep1Schema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be under 1000 characters"),
});

export const createPostStep2Schema = z.object({
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
      message: "Price must be at least $1",
    })
    .refine((val) => Number(val) <= 10000000, {
      message: "Price must be under $10,000,000",
    }),
});

export const createPostSchema = createPostStep1Schema.merge(
  createPostStep2Schema.extend({
    price: z.number().min(1).max(10000000),
  })
);

export const ratingSchema = z.object({
  postId: z.string().min(1),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});

export type CreatePostStep1Input = z.infer<typeof createPostStep1Schema>;
export type CreatePostStep2Input = z.infer<typeof createPostStep2Schema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
```

### 8.2 Types
File: `types/index.ts`

```tsx
export type PostStatus = "pending" | "live" | "rated";

export type Post = {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  status: PostStatus;
  averageRating: number;
  ratingCount: number;
  ratingBreakdown?: { [key: number]: number };
  createdAt: string;
  updatedAt: string;
};

export type Rating = {
  id: string;
  postId: string;
  userId: string;
  rating: number; // 1-5
  createdAt: string;
};

export type User = {
  id: string;
  nickname: string;
  avatarUrl?: string;
  totalPosts: number;
  averageRating: number;
  totalRatingsGiven: number;
  pendingPostId?: string; // ID of unpublished post (if any)
  ratingsNeededToPublish: number; // 0 if post is published or no pending post
};
```

---

## Phase 9: Business Logic Rules

### 9.1 Post Publishing Rules
1. User creates a post → status = "pending"
2. User cannot create another post while they have a pending post
3. User must rate 2 posts to publish their pending post
4. After rating 2 posts → pending post status changes to "live"
5. Post with 5+ ratings → status changes to "rated"

### 9.2 Rating Rules
1. Users cannot rate their own posts
2. Users can only rate each post once
3. Rating is 1-5 stars (integers only)
4. After rating, immediately show next post

---

## Implementation Order

1. **Phase 1**: Navigation & Layout Setup
2. **Phase 10**: API Routes (mock data endpoints)
3. **Phase 11**: API Client Functions
4. **Phase 2**: Home Screen (connected to API)
5. **Phase 3**: Rate Screen (connected to API)
6. **Phase 4**: Create Post Flow
7. **Phase 5**: Post Created Screen
8. **Phase 6**: Profile Screen
9. **Phase 7**: Post Detail Screen
10. **Phase 12**: Authentication with BetterAuth (future)
11. **Phase 13**: Real Database (SQLite or DynamoDB) (future)

---

## Dependencies Summary

Already installed:
- `expo-router` - Navigation
- `@shopify/flash-list` - Performant lists
- `react-native-star-rating-widget` - Star ratings
- `@tanstack/react-query` - Data fetching
- `@tanstack/react-form` - Form handling
- `zustand` - State management
- `zod` - Validation
- `nativewind` - Styling
- `lucide-react-native` - Icons
- `expo-haptics` - Haptic feedback
- `expo-blur` - Blur effects
- `better-auth` - Authentication

---

## File Structure Summary

```
app/
├── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx                  # Home (with profile button in header)
│   ├── rate.tsx
│   └── create-placeholder.tsx     # Dummy file for + button tab slot
├── profile.tsx                    # Profile (accessed from home header)
├── api/
│   ├── posts+api.ts
│   ├── posts/
│   │   └── [id]+api.ts
│   ├── posts-to-rate+api.ts
│   ├── ratings+api.ts
│   └── user+api.ts
├── create/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── price.tsx
│   └── review.tsx
├── post-created.tsx
└── post/
    └── [id].tsx

components/
├── CreateTabButton.tsx
├── HapticTab.tsx
├── PostCard.tsx
├── RatingCard.tsx
├── RatingBreakdown.tsx
└── StatusBadge.tsx

theme/
├── colors.js                      # Source of truth (CommonJS)
└── colors.ts                      # Re-exports for TypeScript

stores/
└── createPostStore.ts

schemas/
└── post.ts

lib/
└── api.ts

mocks/
└── data.ts

hooks/
└── useAuth.ts

types/
└── index.ts

utils/
└── date.ts

# Root config files
├── tailwind.config.js             # Extends Tailwind with semantic tokens
├── metro.config.js                # NativeWind + Tailwind config connection
├── global.css                     # Tailwind imports + component classes
└── nativewind-env.d.ts            # TypeScript types for NativeWind
```
