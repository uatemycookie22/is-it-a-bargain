import { View, ViewProps } from "react-native";

export function Card({ className = "", ...props }: ViewProps) {
  return (
    <View
      className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
      {...props}
    />
  );
}
