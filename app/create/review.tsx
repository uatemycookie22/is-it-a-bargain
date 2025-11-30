import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useCreatePostStore } from "@/stores/createPostStore";
import { createPost } from "@/lib/api";

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
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</Text>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">{title}</Text>

      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mt-6">Description</Text>
      <Text className="text-base text-gray-700 dark:text-gray-300">{description}</Text>

      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mt-6">Price</Text>
      <Text className="text-3xl font-bold text-green-500">${Number(price).toLocaleString()}</Text>

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-2xl mb-safe-or-8 self-center w-4/5 ${createMutation.isPending ? "bg-gray-400" : "bg-green-500"}`}
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
