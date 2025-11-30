import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import StarRating from "react-native-star-rating-widget";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { fetchPost } from "@/lib/api";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchPost(id!),
    enabled: !!id,
  });

  const post = data?.post;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">Post not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: post.title }} />
      <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4">
        <View className="flex-row justify-between items-start">
          <Text className="text-2xl font-bold flex-1 text-gray-900 dark:text-white">
            {post.title}
          </Text>
          <StatusBadge status={post.status} />
        </View>

        <Text className="text-gray-600 dark:text-gray-400 mt-4 text-base leading-6">
          {post.description}
        </Text>

        <Text className="text-3xl font-bold text-green-500 mt-6">
          ${post.price.toLocaleString()}
        </Text>

        {/* Rating Summary */}
        <View className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Text className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Rating Summary
          </Text>

          <View className="flex-row items-center">
            <Text className="text-4xl font-bold text-gray-900 dark:text-white">
              {post.averageRating.toFixed(1)}
            </Text>
            <View className="ml-4">
              <StarRating
                rating={post.averageRating}
                onChange={() => {}}
                starSize={24}
                color="#10b981"
                emptyColor="#d1d5db"
                enableSwiping={false}
              />
              <Text className="text-gray-500 dark:text-gray-400 mt-1">
                {post.ratingCount} ratings
              </Text>
            </View>
          </View>

          {post.ratingBreakdown && (
            <RatingBreakdown breakdown={post.ratingBreakdown} total={post.ratingCount} />
          )}
        </View>

        {/* Pending notice */}
        {post.status === "pending" && (
          <View className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <Text className="text-yellow-800 dark:text-yellow-200 font-medium">
              This post is pending. Rate other posts to publish it!
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
