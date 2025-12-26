import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function SignupLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
        headerTintColor: isDark ? "#ffffff" : "#000000",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Create Account" }} />
      <Stack.Screen name="verify" options={{ title: "Verify Email" }} />
      <Stack.Screen name="username" options={{ title: "Choose Username" }} />
    </Stack>
  );
}
