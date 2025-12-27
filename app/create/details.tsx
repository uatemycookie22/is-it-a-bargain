import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { z } from "zod";

const detailsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  price: z.string().min(1, "Price is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 1,
    "Price must be at least $1"
  ),
});

export default function CreateDetailsStep() {
  const router = useRouter();
  const { title, description, price, updateData, errors, setErrors } = useCreatePostStore();

  const handleContinue = () => {
    const result = detailsSchema.safeParse({ title, description, price });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    router.push("/create/review");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView className="flex-1 p-4">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</Text>
        <TextInput
          className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
            errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
          placeholder="e.g., 2019 Honda Civic LX"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={(text) => updateData({ title: text })}
          maxLength={100}
        />
        {errors.title && <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>}
        <Text className="text-gray-400 text-xs mt-1">{title.length}/100</Text>

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-6">Description</Text>
        <TextInput
          className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 h-32 ${
            errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
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

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-6">Price</Text>
        <View className={`flex-row items-center border rounded-xl px-4 bg-white dark:bg-gray-800 ${
          errors.price ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        }`}>
          <Text className="text-2xl text-gray-400">$</Text>
          <TextInput
            className="flex-1 py-3 px-2 text-2xl text-gray-900 dark:text-white"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            value={price}
            onChangeText={(text) => updateData({ price: text.replace(/[^0-9]/g, "") })}
            keyboardType="numeric"
          />
        </View>
        {errors.price && <Text className="text-red-500 text-sm mt-1">{errors.price}</Text>}
      </ScrollView>

      <View className="p-4">
        <Pressable
          className="py-4 rounded-2xl bg-green-500 mb-safe-or-8 self-center w-4/5"
          onPress={handleContinue}
        >
          <Text className="text-white text-center font-semibold text-lg">Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
