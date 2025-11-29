import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { Stack } from "expo-router";
import { colors } from "@/theme/colors";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Posts",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="mr-4"
            >
              <User color={colors.primary.DEFAULT} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 items-center justify-center bg-background-primary">
        <Text className="text-2xl font-bold text-text-primary">My Posts</Text>
        <Text className="text-text-secondary mt-2">Home screen placeholder</Text>
      </View>
    </>
  );
}
