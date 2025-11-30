import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Inbox color="#9ca3af" size={64} />
      <Text className="text-xl font-semibold text-text-primary dark:text-white mt-4 text-center">
        No posts yet
      </Text>
      <Text className="text-text-secondary dark:text-gray-400 mt-2 text-center">
        Tap the + button to create your first post
      </Text>
    </View>
  );
}
