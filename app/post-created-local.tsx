import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";

export default function PostCreatedLocalScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
      <FileText color="#10b981" size={80} />

      <Text className="text-2xl font-bold mt-6 text-center text-gray-900 dark:text-white">
        Post Saved!
      </Text>

      <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center text-base leading-6">
        Your post has been saved locally. Sign up to publish it and let others rate your deal!
      </Text>

      <Pressable
        className="bg-green-500 py-4 px-8 rounded-2xl mt-8 w-4/5"
        onPress={() => router.replace("/signup")}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Sign Up to Publish
        </Text>
      </Pressable>

      <Pressable
        className="py-4 px-8 mt-4"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-gray-500 dark:text-gray-400 text-center font-medium">
          Later
        </Text>
      </Pressable>
    </View>
  );
}
