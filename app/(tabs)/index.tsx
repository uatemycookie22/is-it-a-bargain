import { useState, useTransition, useRef, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { useRouter, Stack } from "expo-router";
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
