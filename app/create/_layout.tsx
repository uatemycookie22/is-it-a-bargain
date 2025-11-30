import { Stack, useRouter } from "expo-router";
import { useColorScheme, TouchableOpacity, Text } from "react-native";
import { useCreatePostStore } from "@/stores/createPostStore";

export default function CreateLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const resetData = useCreatePostStore((s) => s.resetData);

  const handleCancel = () => {
    resetData();
    router.back();
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
        headerTintColor: isDark ? "#ffffff" : "#000000",
        headerLeft: () => (
          <TouchableOpacity onPress={handleCancel}>
            <Text className="text-green-500 text-base">Cancel</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Details" }} />
      <Stack.Screen name="price" options={{ title: "Price", headerLeft: undefined }} />
      <Stack.Screen name="review" options={{ title: "Review", headerLeft: undefined }} />
    </Stack>
  );
}
