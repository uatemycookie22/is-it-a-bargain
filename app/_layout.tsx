import "../global.css";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
          headerTintColor: isDark ? "#ffffff" : "#000000",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="login"
          options={{ headerShown: true, title: "Sign In" }}
        />
        <Stack.Screen name="signup" />
        <Stack.Screen
          name="forgot-password"
          options={{ headerShown: true, title: "Reset Password" }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ headerShown: true, title: "New Password" }}
        />
        <Stack.Screen
          name="create"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile"
          options={{ headerShown: true, title: "Profile" }}
        />
        <Stack.Screen
          name="post-created"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="post/[id]"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="post-created-local"
          options={{ headerShown: false }}
        />
      </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
