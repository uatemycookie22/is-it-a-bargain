import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";

export default function PostCreatedScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
      <CheckCircle color="#10b981" size={80} />

      <Text className="text-2xl font-bold mt-6 text-center text-gray-900 dark:text-white">
        Post Created!
      </Text>

      <Text className="text-gray-600 dark:text-gray-400 mt-4 text-center text-base leading-6">
        Your post has been created, but it won't be published until you rate other posts first.
      </Text>

      <Text className="text-gray-500 dark:text-gray-500 mt-2 text-center text-sm">
        Rate at least 2 posts to publish yours.
      </Text>

      <Pressable
        className="bg-green-500 py-4 rounded-2xl mt-8 w-4/5"
        onPress={() => router.replace("/(tabs)/rate")}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Go to Rate Posts
        </Text>
      </Pressable>

      <Pressable
        className="py-4 mt-4"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-gray-500 dark:text-gray-400 text-center font-medium">
          Later
        </Text>
      </Pressable>
    </View>
  );
}
