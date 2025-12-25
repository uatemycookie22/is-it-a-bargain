# Phase 8: Anonymous Flow

## Goal
Allow anonymous users to create posts locally, then prompt signup to publish.

## Prerequisites
- Phase 7 complete (login UI)

---

## Steps

### 8.1 Create Local Post Store

**File:** `stores/localPostStore.ts`

```ts
import { create } from "zustand";

type LocalPost = {
  title: string;
  description: string;
  price: number;
  currencyCode: string;
  listingUrl: string;
  imageUrl: string;
  category: string;
};

type LocalPostStore = {
  post: LocalPost | null;
  setPost: (post: LocalPost) => void;
  clearPost: () => void;
  hasPost: () => boolean;
};

export const useLocalPostStore = create<LocalPostStore>((set, get) => ({
  post: null,
  setPost: (post) => set({ post }),
  clearPost: () => set({ post: null }),
  hasPost: () => get().post !== null,
}));
```

### 8.2 Create Auth Context

**File:** `contexts/AuthContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; username: string } | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value = {
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    user: session?.user || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### 8.3 Update Root Layout with Auth Provider

**File:** `app/_layout.tsx` (update)

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
            headerTintColor: isDark ? "#ffffff" : "#000000",
          }}
        >
          {/* ... existing screens ... */}
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 8.4 Update Home Screen for Anonymous Users

**File:** `app/(tabs)/index.tsx` (update)

```tsx
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { User, Plus } from "lucide-react-native";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { fetchMyPosts } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalPostStore } from "@/stores/localPostStore";
import { colors } from "@/theme/colors";
import { useState, useTransition, useRef, useEffect } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { post: localPost } = useLocalPostStore();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<FlashList<any>>(null);

  // Only fetch posts if authenticated
  const { data, fetchNextPage, hasNextPage, refetch, isRefetching, isLoading } =
    useInfiniteQuery({
      queryKey: ["my-posts", search],
      queryFn: ({ pageParam }) => fetchMyPosts({ page: pageParam, search }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
      enabled: isAuthenticated,
    });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [search]);

  const handleSearchChange = (text: string) => {
    startTransition(() => setSearch(text));
  };

  // Loading state
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  // Anonymous user with no local post
  if (!isAuthenticated && !localPost) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Is It A Bargain?" }} />
        <View className="flex-1 bg-background-primary dark:bg-gray-900 items-center justify-center p-8">
          <Text className="text-6xl mb-4">🏷️</Text>
          <Text className="text-2xl font-bold text-text-primary dark:text-white text-center">
            Find out if it's a good deal
          </Text>
          <Text className="text-text-secondary dark:text-gray-400 text-center mt-2">
            Post a listing and let others rate it
          </Text>
          <TouchableOpacity
            className="bg-primary py-4 px-8 rounded-2xl mt-8"
            onPress={() => router.push("/create")}
          >
            <View className="flex-row items-center">
              <Plus color="#fff" size={20} />
              <Text className="text-white font-semibold text-lg ml-2">
                Create Your First Post
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Anonymous user with local post - show it with "sign up to publish" message
  if (!isAuthenticated && localPost) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "My Posts" }} />
        <View className="flex-1 bg-background-primary dark:bg-gray-900">
          <View className="bg-yellow-50 dark:bg-yellow-900/20 mx-4 mt-4 p-4 rounded-xl">
            <Text className="text-yellow-800 dark:text-yellow-200 font-medium">
              Sign up to publish your post and let others rate it!
            </Text>
            <TouchableOpacity
              className="bg-primary py-2 px-4 rounded-lg mt-3 self-start"
              onPress={() => router.push("/signup")}
            >
              <Text className="text-white font-medium">Sign Up</Text>
            </TouchableOpacity>
          </View>
          <View className="mx-4 my-4 p-4 bg-background-secondary dark:bg-gray-800 rounded-xl border border-border-primary dark:border-gray-700">
            <View className="flex-row justify-between items-start">
              <Text className="text-lg font-semibold text-text-primary dark:text-white flex-1">
                {localPost.title}
              </Text>
              <View className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  Draft
                </Text>
              </View>
            </View>
            <Text className="text-text-secondary dark:text-gray-400 mt-1" numberOfLines={2}>
              {localPost.description}
            </Text>
            <Text className="text-xl font-bold text-primary mt-2">
              ${(localPost.price / 100).toLocaleString()}
            </Text>
          </View>
        </View>
      </>
    );
  }

  // Authenticated user - show their posts
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Posts",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/profile")} className="mr-4">
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
          ListEmptyComponent={
            !isLoading && posts.length === 0 ? (
              <EmptyState
                title="No posts yet"
                message="Create your first post to get started"
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={false}
        />
      </View>
    </>
  );
}
```

### 8.5 Update Rate Screen for Anonymous Users

**File:** `app/(tabs)/rate.tsx` (update)

```tsx
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RatingCard } from "@/components/RatingCard";
import { fetchPostToRate, submitRating } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";

export default function RateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["post-to-rate"],
    queryFn: fetchPostToRate,
    enabled: isAuthenticated,
  });

  const rateMutation = useMutation({
    mutationFn: submitRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      refetch();
    },
  });

  // Loading
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  // Not authenticated - prompt signup
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-background-primary dark:bg-gray-900 items-center justify-center p-8">
        <Text className="text-6xl mb-4">⭐</Text>
        <Text className="text-2xl font-bold text-text-primary dark:text-white text-center">
          Rate deals from others
        </Text>
        <Text className="text-text-secondary dark:text-gray-400 text-center mt-2">
          Sign up to start rating posts and help others find good deals
        </Text>
        <TouchableOpacity
          className="bg-primary py-4 px-8 rounded-2xl mt-8"
          onPress={() => router.push("/signup")}
        >
          <Text className="text-white font-semibold text-lg">Sign Up to Rate</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-4" onPress={() => router.push("/login")}>
          <Text className="text-primary">Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  const post = data?.post;

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-background-primary dark:bg-gray-900">
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-xl font-semibold text-text-primary dark:text-white text-center">
          All caught up!
        </Text>
        <Text className="text-text-secondary dark:text-gray-400 mt-2 text-center">
          No more posts to rate right now. Check back later!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-secondary dark:bg-gray-900">
      <RatingCard
        key={post.id}
        post={post}
        onRate={(rating) => rateMutation.mutate({ postId: post.id, rating })}
        isSubmitting={rateMutation.isPending}
      />
    </View>
  );
}
```

### 8.6 Update Create Tab Button

**File:** `components/CreateTabButton.tsx` (update)

```tsx
import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalPostStore } from "@/stores/localPostStore";

export function CreateTabButton() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { hasPost } = useLocalPostStore();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If anonymous and already has a local post, go to signup
    if (!isAuthenticated && hasPost()) {
      router.push("/signup");
      return;
    }

    // Otherwise, go to create flow
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

### 8.7 Update Create Flow to Save Locally for Anonymous Users

**File:** `app/create/review.tsx` (update)

```tsx
import { View, Text, Pressable, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreatePostStore } from "@/stores/createPostStore";
import { useLocalPostStore } from "@/stores/localPostStore";
import { useAuth } from "@/contexts/AuthContext";
import { createPost } from "@/lib/api";

export default function CreateReview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { title, description, price, listingUrl, imageUrl, category, resetData } = useCreatePostStore();
  const { setPost } = useLocalPostStore();

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      resetData();
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      router.replace("/post-created");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to create post. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (isAuthenticated) {
      // Authenticated: create on server
      createMutation.mutate({
        title,
        description,
        price: parseInt(price) * 100, // Convert to cents
        listingUrl,
        imageUrl,
        category,
      });
    } else {
      // Anonymous: save locally
      setPost({
        title,
        description,
        price: parseInt(price) * 100,
        currencyCode: "USD",
        listingUrl,
        imageUrl,
        category: category || "used_cars",
      });
      resetData();
      router.replace("/post-created-local");
    }
  };

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      {/* Image Preview */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48 rounded-xl mb-4"
          resizeMode="cover"
        />
      )}

      <Text className="text-lg font-semibold text-text-secondary dark:text-gray-400 mb-1">
        Title
      </Text>
      <Text className="text-xl font-bold text-text-primary dark:text-white">
        {title}
      </Text>

      <Text className="text-lg font-semibold text-text-secondary dark:text-gray-400 mb-1 mt-6">
        Description
      </Text>
      <Text className="text-base text-text-primary dark:text-white">
        {description}
      </Text>

      <Text className="text-lg font-semibold text-text-secondary dark:text-gray-400 mb-1 mt-6">
        Price
      </Text>
      <Text className="text-3xl font-bold text-primary">
        ${Number(price).toLocaleString()}
      </Text>

      <Text className="text-lg font-semibold text-text-secondary dark:text-gray-400 mb-1 mt-6">
        Listing URL
      </Text>
      <Text className="text-base text-primary" numberOfLines={1}>
        {listingUrl}
      </Text>

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          createMutation.isPending ? "bg-gray-400" : "bg-primary"
        }`}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {createMutation.isPending
            ? "Creating..."
            : isAuthenticated
            ? "Create Post"
            : "Save Post"}
        </Text>
      </Pressable>
    </View>
  );
}
```

### 8.8 Create Local Post Created Screen

**File:** `app/post-created-local.tsx`

```tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";

export default function PostCreatedLocalScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-6 justify-center items-center">
      <FileText color="#10b981" size={80} />

      <Text className="text-2xl font-bold mt-6 text-center text-text-primary dark:text-white">
        Post Saved!
      </Text>

      <Text className="text-text-secondary dark:text-gray-400 mt-4 text-center text-base leading-6">
        Your post has been saved locally. Sign up to publish it and let others rate your deal!
      </Text>

      <Pressable
        className="bg-primary py-4 px-8 rounded-2xl mt-8 w-4/5"
        onPress={() => router.replace("/signup")}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Sign Up to Publish
        </Text>
      </Pressable>

      <Pressable
        className="py-4 px-8 mt-4"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-text-secondary dark:text-gray-400 text-center font-medium">
          Later
        </Text>
      </Pressable>
    </View>
  );
}
```

### 8.9 Upload Local Post After Signup

**File:** `app/signup/username.tsx` (update handleComplete)

```tsx
// In the saveMutation onSuccess callback:
onSuccess: async () => {
  // Check if there's a local post to upload
  const localPost = useLocalPostStore.getState().post;
  if (localPost) {
    try {
      await createPost(localPost);
      useLocalPostStore.getState().clearPost();
    } catch (error) {
      console.error("Failed to upload local post:", error);
      // Don't block signup completion, user can try again
    }
  }

  reset();
  router.replace("/(tabs)");
},
```

---

## Deploy

```bash
git add .
git commit -m "Phase 8: Anonymous flow with local post storage"
git push origin main
```

---

## File Structure After Phase 8

```
is-it-a-bargain/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # UPDATED - Anonymous support
│   │   └── rate.tsx           # UPDATED - Anonymous support
│   ├── create/
│   │   └── review.tsx         # UPDATED - Local save for anonymous
│   ├── post-created-local.tsx # NEW - Local post success screen
│   └── signup/
│       └── username.tsx       # UPDATED - Upload local post
├── stores/
│   └── localPostStore.ts      # NEW - Local post storage
├── contexts/
│   └── AuthContext.tsx        # NEW - Auth context
├── components/
│   └── CreateTabButton.tsx    # UPDATED - Anonymous handling
└── ... existing files
```

---

## Test Cases

### TC8.1: Anonymous Home Screen
- [ ] Open app without logging in
- [ ] Should see "Create Your First Post" empty state
- [ ] Should NOT see profile icon in header

### TC8.2: Anonymous Create Post
- [ ] Tap "Create Your First Post"
- [ ] Complete create flow
- [ ] Should see "Post Saved!" screen
- [ ] Should see "Sign Up to Publish" button

### TC8.3: Anonymous Home with Local Post
- [ ] After creating local post, go to home
- [ ] Should see local post with "Draft" badge
- [ ] Should see "Sign up to publish" banner

### TC8.4: Anonymous Rate Screen
- [ ] Tap Rate tab without logging in
- [ ] Should see "Sign up to rate" message
- [ ] Should have Sign Up button

### TC8.5: Anonymous Second Post Attempt
- [ ] Create a local post
- [ ] Tap + button again
- [ ] Should redirect to signup (not create flow)

### TC8.6: Local Post Upload After Signup
- [ ] Create local post as anonymous
- [ ] Complete signup flow
- [ ] Local post should be uploaded automatically
- [ ] Should appear in "My Posts" with pending status

### TC8.7: Local Post Persistence
- [ ] Create local post
- [ ] Close app completely
- [ ] Reopen app
- [ ] Local post should be GONE (stored in memory only)

---

## Troubleshooting

### Local post not showing on home
- Check `useLocalPostStore` is returning the post
- Verify `isAuthenticated` is false

### Post not uploading after signup
- Check `createPost` is being called in username.tsx
- Verify local post data matches API schema

### Auth state not updating
- Check `AuthProvider` wraps the app
- Verify `useSession` is working correctly
