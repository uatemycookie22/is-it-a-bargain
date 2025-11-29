import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export function CreateTabButton() {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/create");
  };

  return (
    <View className="flex-1 justify-center items-center">
      <TouchableOpacity
        className="bg-green-500 rounded-full w-14 h-14 items-center justify-center shadow-lg -mt-8"
        onPress={handlePress}
      >
        <Plus color="#ffffff" size={28} />
      </TouchableOpacity>
    </View>
  );
}
