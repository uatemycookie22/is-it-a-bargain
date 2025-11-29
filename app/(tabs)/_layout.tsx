import { Tabs } from "expo-router";
import { Home, Star } from "lucide-react-native";
import { CreateTabButton } from "@/components/CreateTabButton";
import { HapticTab } from "@/components/HapticTab";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#6b7280",
        tabBarButton: HapticTab,
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
