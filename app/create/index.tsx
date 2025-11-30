import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { createPostStep1Schema } from "@/schemas/post";

export default function CreateStep1() {
  const router = useRouter();
  const { title, description, updateData, errors, setErrors } = useCreatePostStore();

  const handleContinue = () => {
    const result = createPostStep1Schema.safeParse({ title, description });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    router.push("/create/price");
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</Text>
      <TextInput
        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 text-base text-gray-900 dark:text-white w-full"
        style={{ height: 48, lineHeight: 0 }}
        placeholder="e.g., 2019 Honda Civic"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={(text) => updateData({ title: text })}
        maxLength={100}
      />
      {errors.title && <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>}
      <Text className="text-gray-400 text-xs mt-1">{title.length}/100</Text>

      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-6">Description</Text>
      <TextInput
        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 pt-3 text-base h-32"
        placeholder="Describe the listing..."
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={(text) => updateData({ description: text })}
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />
      {errors.description && <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>}
      <Text className="text-gray-400 text-xs mt-1">{description.length}/1000</Text>

      <View className="flex-1" />

      <Pressable className="py-4 rounded-2xl bg-green-500 mb-safe-or-8 self-center w-4/5" onPress={handleContinue}>
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}
