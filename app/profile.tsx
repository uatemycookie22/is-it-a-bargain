import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Settings, LogOut, ChevronRight } from "lucide-react-native";
import { fetchUser } from "@/lib/api";

export default function ProfileScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
  });

  const user = data?.user;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 dark:bg-gray-900">
      {/* Profile Header */}
      <View className="bg-white dark:bg-gray-800 p-6 items-center">
        <Image
          source={{ uri: user?.avatarUrl || "https://via.placeholder.com/100" }}
          className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700"
        />
        <Text className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
          {user?.nickname || "User"}
        </Text>
      </View>

      {/* Stats */}
      <View className="bg-white dark:bg-gray-800 mt-4 p-6 flex-row justify-around">
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.totalPosts || 0}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">Posts</Text>
        </View>
        <View className="w-px bg-gray-200 dark:bg-gray-700" />
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.averageRating ? user.averageRating.toFixed(1) : "—"}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">Avg Rating</Text>
        </View>
        <View className="w-px bg-gray-200 dark:bg-gray-700" />
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.totalRatingsGiven || 0}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">Rated</Text>
        </View>
      </View>

      {/* Settings */}
      <View className="bg-white dark:bg-gray-800 mt-4">
        <Pressable className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <Settings color="#6b7280" size={24} />
          <Text className="flex-1 ml-4 text-base text-gray-900 dark:text-white">Settings</Text>
          <ChevronRight color="#9ca3af" size={20} />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable className="bg-white dark:bg-gray-800 mt-4 p-4 flex-row items-center">
        <LogOut color="#ef4444" size={24} />
        <Text className="ml-4 text-base text-red-500">Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}
