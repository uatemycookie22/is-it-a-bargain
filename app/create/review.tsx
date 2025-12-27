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
  const { title, description, price, listingUrl, localImageUri, imageUrl, resetData } = useCreatePostStore();
  const { setPost } = useLocalPostStore();

  const displayImage = imageUrl || localImageUri;

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
      createMutation.mutate({
        title,
        description,
        price: Number(price),
        listingUrl,
        imageUrl,
      });
    } else {
      // Save locally with local image URI
      setPost({
        title,
        description,
        price: Number(price) * 100,
        listingUrl,
        localImageUri,
      });
      resetData();
      router.replace("/post-created-local");
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      {displayImage && (
        <Image
          source={{ uri: displayImage }}
          className="w-full h-48 rounded-xl mb-4"
          resizeMode="cover"
        />
      )}

      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</Text>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">{title}</Text>

      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mt-6">Description</Text>
      <Text className="text-base text-gray-700 dark:text-gray-300">{description}</Text>

      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mt-6">Price</Text>
      <Text className="text-3xl font-bold text-green-500">${Number(price).toLocaleString()}</Text>

      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mt-6">Listing URL</Text>
      <Text className="text-base text-green-500" numberOfLines={1}>{listingUrl}</Text>

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-2xl mb-safe-or-8 self-center w-4/5 ${createMutation.isPending ? "bg-gray-400" : "bg-green-500"}`}
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
