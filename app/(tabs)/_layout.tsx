import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Home, Star } from "lucide-react-native";
import { CreateTabButton } from "@/components/CreateTabButton";
import { HapticTab } from "@/components/HapticTab";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderTopColor: isDark ? "#374151" : "#e5e7eb",
        },
        headerStyle: {
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
        },
        headerTintColor: isDark ? "#ffffff" : "#000000",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Posts",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create-placeholder"
        options={{
          tabBarButton: () => <CreateTabButton />,
        }}
      />
      <Tabs.Screen
        name="rate"
        options={{
          title: "Rate",
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
