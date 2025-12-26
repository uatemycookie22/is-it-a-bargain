import { useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSignupStore } from "@/stores/signupStore";
import { checkUsernameAvailable } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useDebounce } from "@/hooks/useDebounce";

export default function SignupStep3() {
  const router = useRouter();
  const { username, updateData, errors, setErrors, reset } = useSignupStore();

  // Redirect to signup if not authenticated
  useEffect(() => {
    // For now, skip this check since we're not auto-logging in
    // TODO: Re-enable after fixing email verification flow
  }, []);

  const debouncedUsername = useDebounce(username, 500);

  const { data: availabilityData } = useQuery({
    queryKey: ["username-available", debouncedUsername],
    queryFn: () => checkUsernameAvailable(debouncedUsername),
    enabled: debouncedUsername.length >= 3,
  });

  useEffect(() => {
    if (availabilityData && !availabilityData.available) {
      setErrors({ username: availabilityData.error || "Username is taken" });
    } else if (availabilityData?.available) {
      setErrors({});
    }
  }, [availabilityData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('[USERNAME] Setting username:', username.toLowerCase());
      // Use BetterAuth updateUser to set username
      const result = await authClient.updateUser({ username: username.toLowerCase() });
      console.log('[USERNAME] Update user result:', JSON.stringify(result));
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to set username');
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log('[USERNAME] Success! Data:', JSON.stringify(data));
      reset();
      router.replace("/(tabs)");
    },
    onError: (error: Error) => {
      console.error('[USERNAME] Error:', error);
      setErrors({ form: error.message || 'Failed to set username. Please try again.' });
    },
  });

  const validate = () => {
    if (username.length < 3) {
      setErrors({ username: "Username must be at least 3 characters" });
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrors({ username: "Only letters, numbers, and underscores" });
      return false;
    }
    if (!availabilityData?.available) {
      return false;
    }
    return true;
  };

  const handleComplete = () => {
    if (validate()) {
      saveMutation.mutate();
    }
  };

  const isAvailable = availabilityData?.available && username.length >= 3;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mt-8">
        Choose a username
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        This is how others will see you
      </Text>

      {/* Username Input */}
      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2 mt-8">
        Username
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          errors.username
            ? "border-red-500"
            : isAvailable
            ? "border-green-500"
            : "border-gray-300 dark:border-gray-700"
        }`}
        placeholder="cooluser123"
        placeholderTextColor="#9ca3af"
        value={username}
        onChangeText={(text) => updateData({ username: text.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />
      {errors.username && (
        <Text className="text-red-500 text-sm mt-1">{errors.username}</Text>
      )}
      {isAvailable && (
        <Text className="text-green-600 text-sm mt-1">Username is available!</Text>
      )}
      <Text className="text-gray-400 text-xs mt-1">
        3-20 characters, letters, numbers, underscores only
      </Text>

      {errors.form && (
        <Text className="text-red-500 text-sm mt-4 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      {/* Complete Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-8 ${
          saveMutation.isPending || !isAvailable ? "bg-gray-400" : "bg-green-500"
        }`}
        onPress={handleComplete}
        disabled={saveMutation.isPending || !isAvailable}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Complete Signup</Text>
        )}
      </Pressable>
    </View>
  );
}
