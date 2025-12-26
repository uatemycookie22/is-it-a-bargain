import { useState, useTransition, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, Stack } from "expo-router";
import { FlashList, FlashListProps, type FlashListRef } from "@shopify/flash-list";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { User, Plus } from "lucide-react-native";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { fetchMyPosts } from "@/lib/api";
import { useSession, authClient } from "@/lib/auth-client";
import { colors } from "@/theme/colors";
import { Post } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const { data: session, isPending: authLoading, error: authError } = useSession();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<FlashListRef<Post>>(null);

  const isAuthenticated = !!session?.user && !authError;

  const { data, fetchNextPage, hasNextPage, refetch, isRefetching, isLoading, error: postsError } = 
    useInfiniteQuery({
      queryKey: ["my-posts", search],
      queryFn: ({ pageParam }) => fetchMyPosts({ page: pageParam, search }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
      placeholderData: keepPreviousData,
      enabled: isAuthenticated, // Only fetch if logged in
      retry: false, // Don't retry on 401
    });

  // If we get 401 error, sign out
  useEffect(() => {
    if (postsError && postsError.message.includes('Unauthorized')) {
      console.log('[HOME] Got 401, signing out...');
      authClient.signOut().then(() => {
        console.log('[HOME] Signed out, reloading...');
        window.location.reload();
      });
    }
  }, [postsError]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [search]);

  const handleSearchChange = (text: string) => {
    startTransition(() => setSearch(text));
  };

  // Loading auth state
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  console.log('[HOME] Auth state:', { isAuthenticated, hasSession: !!session, hasUser: !!session?.user, authError });

  // Not logged in - show welcome screen
  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Is It A Bargain?" }} />
        <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center p-8">
          <Text className="text-6xl mb-4">🏷️</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            Find out if it's a good deal
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
            Post a listing and let others rate it
          </Text>
          <TouchableOpacity
            className="bg-green-500 py-4 px-8 rounded-2xl mt-8"
            onPress={() => router.push("/signup")}
          >
            <View className="flex-row items-center">
              <Plus color="#fff" size={20} />
              <Text className="text-white font-semibold text-lg ml-2">
                Get Started
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Logged in - show posts
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
      <View className="flex-1 bg-white dark:bg-gray-900">
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
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={!isLoading && posts.length === 0 ? <EmptyState /> : null}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={false}
        />
      </View>
    </>
  );
}
