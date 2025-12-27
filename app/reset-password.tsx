import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token, error: urlError } = useLocalSearchParams<{ token?: string; error?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (urlError === "INVALID_TOKEN") {
      setError("Reset link is invalid or has expired. Please request a new one.");
    }
  }, [urlError]);

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No reset token provided");
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        throw new Error(result.error.message || "Failed to reset password");
      }
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: Error) => {
      setError("Failed to reset password. Link may have expired.");
    },
  });

  const handleReset = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    resetMutation.mutate();
  };

  if (!token && !urlError) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-4 justify-center items-center">
        <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
          Invalid reset link
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4">
          Please use the link from your email
        </Text>
        <Pressable
          className="mt-8 py-4 px-8 rounded-2xl bg-green-500"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-white font-semibold">Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  if (success) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-4 justify-center items-center">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          Password reset!
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4">
          You can now sign in with your new password
        </Text>
        <Pressable
          className="mt-8 py-4 px-8 rounded-2xl bg-green-500"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-white font-semibold">Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mt-8">
        Set new password
      </Text>

      {/* New Password */}
      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2 mt-8">
        New Password
      </Text>
      <TextInput
        className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        placeholder="At least 8 characters"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />

      {/* Confirm Password */}
      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2 mt-4">
        Confirm Password
      </Text>
      <TextInput
        className="border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        placeholder="Confirm your password"
        placeholderTextColor="#9ca3af"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {error && <Text className="text-red-500 text-sm mt-4 text-center">{error}</Text>}

      <View className="flex-1" />

      {/* Reset Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-8 ${
          resetMutation.isPending ? "bg-gray-400" : "bg-green-500"
        }`}
        onPress={handleReset}
        disabled={resetMutation.isPending || !!urlError}
      >
        {resetMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Reset Password</Text>
        )}
      </Pressable>
    </View>
  );
}
