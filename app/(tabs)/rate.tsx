import { useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RatingCard } from "@/components/RatingCard";
import { fetchPostsToRate, submitRating } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";

export default function RateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["posts-to-rate"],
    queryFn: fetchPostsToRate,
    enabled: isAuthenticated,
  });

  const rateMutation = useMutation({
    mutationFn: submitRating,
    onSuccess: () => {
      setCurrentIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    },
  });

  // Loading auth
  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  // Not authenticated - prompt signup
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center p-8">
        <Text className="text-6xl mb-4">⭐</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          Rate deals from others
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
          Sign up to start rating posts and help others find good deals
        </Text>
        <TouchableOpacity
          className="bg-green-500 py-4 px-8 rounded-2xl mt-8"
          onPress={() => router.push("/signup")}
        >
          <Text className="text-white font-semibold text-lg">Sign Up to Rate</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-4" onPress={() => router.push("/login")}>
          <Text className="text-green-500">Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  const posts = data?.posts ?? [];
  const currentPost = posts[currentIndex];

  if (!currentPost) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-white dark:bg-gray-900">
        <Text className="text-4xl">🎉</Text>
        <Text className="text-xl font-semibold mt-4 text-center text-gray-900 dark:text-white">
          All caught up!
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
          No more posts to rate right now. Check back later!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900">
      <RatingCard
        key={currentPost.id}
        post={currentPost}
        onRate={(rating) => rateMutation.mutate({ postId: currentPost.id, rating })}
        isSubmitting={rateMutation.isPending}
      />
    </View>
  );
}
