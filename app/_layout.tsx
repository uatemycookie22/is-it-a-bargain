import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="create/index" 
          options={{ presentation: "modal", headerShown: true, title: "Create Post" }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ headerShown: true, title: "Profile" }} 
        />
      </Stack>
    </QueryClientProvider>
  );
}
