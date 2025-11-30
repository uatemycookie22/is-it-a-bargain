import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import StarRating from "react-native-star-rating-widget";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { formatRelativeTime } from "@/utils/date";
import { Post } from "@/types";

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/post/${post.id}`)}>
      <Card className="mx-4 my-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {post.title}
          </Text>
        </View>
        <StatusBadge status={post.status} />
      </View>
      
      <Text className="text-gray-600 dark:text-gray-400 mt-1" numberOfLines={2}>
        {post.description}
      </Text>
      
      <Text className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
        ${post.price.toLocaleString()}
      </Text>
      
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <StarRating
            rating={post.averageRating}
            onChange={() => {}}
            starSize={16}
            enableHalfStar={false}
            color="#10b981"
            emptyColor="#d1d5db"
            enableSwiping={false}
            style={{ pointerEvents: "none" }}
          />
          <Text className="text-gray-500 dark:text-gray-400 ml-2">({post.ratingCount})</Text>
        </View>
        <Text className="text-gray-400 dark:text-gray-500 text-sm">
          {formatRelativeTime(post.createdAt)}
        </Text>
      </View>
    </Card>
    </Pressable>
  );
}
