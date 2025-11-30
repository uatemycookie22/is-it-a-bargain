import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RatingCard } from "@/components/RatingCard";
import { fetchPostsToRate, submitRating } from "@/lib/api";

export default function RateScreen() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useQuery({
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
      <View className="flex-1 items-center justify-center bg-background-primary dark:bg-gray-900">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const posts = data?.posts ?? [];
  const currentPost = posts[currentIndex];

  if (!currentPost) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-background-primary dark:bg-gray-900">
        <Text className="text-4xl">🎉</Text>
        <Text className="text-xl font-semibold mt-4 text-center text-text-primary dark:text-white">
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
        key={currentPost.id}
        post={currentPost}
        onRate={(rating) => rateMutation.mutate({ postId: currentPost.id, rating })}
        isSubmitting={rateMutation.isPending}
      />
    </View>
  );
}
