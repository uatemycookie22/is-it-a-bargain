import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import StarRating from "react-native-star-rating-widget";
import { Post } from "@/types";

type Props = {
  post: Post;
  onRate: (rating: number) => void;
  isSubmitting: boolean;
};

export function RatingCard({ post, onRate, isSubmitting }: Props) {
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0 && !isSubmitting) {
      onRate(rating);
    }
  };

  return (
    <View className="flex-1 m-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-text-primary dark:text-white">
          {post.title}
        </Text>
        <Text className="text-text-secondary dark:text-gray-400 mt-3 text-base leading-6">
          {post.description}
        </Text>
        <Text className="text-3xl font-bold text-green-500 mt-6">
          ${post.price.toLocaleString()}
        </Text>
      </View>

      <View className="items-center py-4">
        <Text className="text-lg font-medium text-text-secondary dark:text-gray-300 mb-4">
          Is this a good deal?
        </Text>
        <StarRating
          rating={rating}
          onChange={(r) => setRating(Math.round(r))}
          starSize={48}
          color="#10b981"
          emptyColor="#d1d5db"
        />
        <View className="flex-row justify-between w-full mt-3 px-2">
          <Text className="text-sm text-gray-400">Bad Deal</Text>
          <Text className="text-sm text-gray-400">Bargain!</Text>
        </View>
        <Pressable
          className={`mt-6 px-8 py-3 rounded-lg ${rating > 0 ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          <Text className="text-white font-semibold text-lg">
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
