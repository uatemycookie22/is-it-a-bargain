import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { z } from "zod";

const urlSchema = z.string().url("Please enter a valid URL");

export default function CreateUrlStep() {
  const router = useRouter();
  const { listingUrl, updateData, errors, setErrors } = useCreatePostStore();

  const handleContinue = () => {
    const result = urlSchema.safeParse(listingUrl);
    if (!result.success) {
      setErrors({ url: result.error.issues[0].message });
      return;
    }
    setErrors({});
    router.push("/create/image");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 p-4">
        <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mt-4">
          Paste the listing URL
        </Text>

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-8">
          Listing URL
        </Text>
        <TextInput
          className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
            errors.url ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
          placeholder="https://facebook.com/marketplace/..."
          placeholderTextColor="#9ca3af"
          value={listingUrl}
          onChangeText={(text) => updateData({ listingUrl: text })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {errors.url && (
          <Text className="text-red-500 text-sm mt-1">{errors.url}</Text>
        )}

        <View className="flex-1" />

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
