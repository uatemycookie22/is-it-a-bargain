import { View, Text } from "react-native";

type Props = {
  breakdown: { [key: number]: number };
  total: number;
};

const labels = ["", "Bad Deal", "Below Avg", "Fair", "Good Deal", "Bargain!"];

export function RatingBreakdown({ breakdown, total }: Props) {
  return (
    <View className="mt-4">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <View key={star} className="flex-row items-center mb-2">
            <Text className="w-20 text-sm text-gray-600 dark:text-gray-400">{labels[star]}</Text>
            <View className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-2">
              <View
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </View>
            <Text className="w-8 text-sm text-gray-500 dark:text-gray-400 text-right">{count}</Text>
          </View>
        );
      })}
    </View>
  );
}
