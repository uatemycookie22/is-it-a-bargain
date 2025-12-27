import { useState, useTransition, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter, Stack } from "expo-router";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { User, Plus, Trash2 } from "lucide-react-native";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { fetchMyPosts } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalPostStore } from "@/stores/localPostStore";
import { colors } from "@/theme/colors";
import { Post } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { post: localPost, clearPost } = useLocalPostStore();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<FlashListRef<Post>>(null);

  const { data, fetchNextPage, hasNextPage, refetch, isRefetching, isLoading } = 
    useInfiniteQuery({
      queryKey: ["my-posts", search],
      queryFn: ({ pageParam }) => fetchMyPosts({ page: pageParam, search }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
      placeholderData: keepPreviousData,
      enabled: isAuthenticated,
      retry: false,
    });

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

  // Anonymous user with no local post - show welcome
  if (!isAuthenticated && !localPost) {
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

  // Anonymous user with local post - show draft with signup banner
  if (!isAuthenticated && localPost) {
    const displayImage = localPost.imageUrl || localPost.localImageUri;
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "My Posts" }} />
        <View className="flex-1 bg-white dark:bg-gray-900">
          <View className="bg-yellow-50 dark:bg-yellow-900/20 mx-4 mt-4 p-4 rounded-xl">
            <Text className="text-yellow-800 dark:text-yellow-200 font-medium">
              Sign up to publish your post and let others rate it!
            </Text>
            <TouchableOpacity
              className="bg-green-500 py-2 px-4 rounded-lg mt-3 self-start"
              onPress={() => router.push("/signup")}
            >
              <Text className="text-white font-medium">Sign Up</Text>
            </TouchableOpacity>
          </View>
          <View className="mx-4 my-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {displayImage && (
              <Image
                source={{ uri: displayImage }}
                className="w-full h-32"
                resizeMode="cover"
              />
            )}
            <View className="p-4">
              <View className="flex-row justify-between items-start">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                  {localPost.title}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full">
                    <Text className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      Draft
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="ml-2 p-1"
                    onPress={() => clearPost()}
                  >
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-gray-500 dark:text-gray-400 mt-1" numberOfLines={2}>
                {localPost.description}
              </Text>
              <Text className="text-xl font-bold text-green-500 mt-2">
                ${(localPost.price / 100).toLocaleString()}
              </Text>
            </View>
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
