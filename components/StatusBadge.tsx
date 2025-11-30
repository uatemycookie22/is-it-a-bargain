import { View, Text } from "react-native";
import { PostStatus } from "@/types";

const statusConfig = {
  pending: { className: "badge-pending", label: "Pending" },
  live: { className: "badge-live", label: "Live" },
  rated: { className: "badge-rated", label: "Rated" },
};

export function StatusBadge({ status }: { status: PostStatus }) {
  const config = statusConfig[status];
  return (
    <View className={`badge ${config.className}`}>
      <Text className="text-xs font-medium">{config.label}</Text>
    </View>
  );
}
