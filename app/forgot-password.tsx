import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `isitabargain://reset-password`,
      });
      if (result.error) {
        throw new Error(result.error.message || "Failed to send reset link");
      }
    },
    onSuccess: () => {
      setSent(true);
    },
    onError: (error: Error) => {
      setError("Failed to send reset link. Please try again.");
    },
  });

  const handleSend = () => {
    if (!z.string().email().safeParse(email).success) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    sendMutation.mutate();
  };

  if (sent) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-4 justify-center items-center">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          Check your email
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 px-8">
          We sent a password reset link to {email}
        </Text>
        <Pressable
          className="mt-8 py-4 px-8 rounded-2xl bg-green-500"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Back to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mt-8">
        Reset password
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        Enter your email and we'll send you a reset link
      </Text>

      {/* Email */}
      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2 mt-8">
        Email
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        }`}
        placeholder="you@example.com"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}

      <View className="flex-1" />

      {/* Send Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-4 ${
          sendMutation.isPending ? "bg-gray-400" : "bg-green-500"
        }`}
        onPress={handleSend}
        disabled={sendMutation.isPending}
      >
        {sendMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Send Reset Link</Text>
        )}
      </Pressable>

      {/* Back to Login */}
      <Pressable onPress={() => router.back()} className="mb-8">
        <Text className="text-center text-green-500">Back to Login</Text>
      </Pressable>
    </View>
  );
}
