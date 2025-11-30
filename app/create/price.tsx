import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { createPostStep2Schema } from "@/schemas/post";

export default function CreateStep2() {
  const router = useRouter();
  const { price, updateData, errors, setErrors } = useCreatePostStore();

  const handleContinue = () => {
    const result = createPostStep2Schema.safeParse({ price });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    router.push("/create/review");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
      className="flex-1 bg-white dark:bg-gray-900"
    >
    <View className="flex-1 p-4">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Listing Price</Text>
      <View className="flex-row items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 h-14">
        <Text className="text-2xl text-gray-400">$</Text>
        <TextInput
          className="flex-1 ml-2 text-2xl text-gray-900 dark:text-white"
          style={{ lineHeight: 0 }}
          placeholder="0"
          placeholderTextColor="#9ca3af"
          value={price}
          onChangeText={(text) => updateData({ price: text.replace(/[^0-9]/g, "") })}
          keyboardType="numeric"
        />
      </View>
      {errors.price && <Text className="text-red-500 text-sm mt-1">{errors.price}</Text>}

      <View className="flex-1" />

      <Pressable className="py-4 rounded-2xl bg-green-500 mb-safe-or-8 self-center w-4/5" onPress={handleContinue}>
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </View>
    </KeyboardAvoidingView>
  );
}
