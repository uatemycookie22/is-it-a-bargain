import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { OAuthButtons } from "@/components/OAuthButtons";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log('[LOGIN] Attempting login for:', email);
      const result = await signIn.email({ email, password });
      console.log('[LOGIN] Result:', result);
      if (result.error) {
        throw new Error(result.error.message || "Login failed");
      }
    },
    onSuccess: () => {
      console.log('[LOGIN] Success, redirecting to home');
      router.replace("/(tabs)");
    },
    onError: (error: Error) => {
      console.log('[LOGIN] Error:', error.message);
      setErrors({ form: "Invalid email or password" });
    },
  });

  const validate = () => {
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleLogin = () => {
    console.log('[LOGIN] handleLogin called, email:', email, 'password length:', password.length);
    if (validate()) {
      console.log('[LOGIN] Validation passed, calling mutation');
      loginMutation.mutate();
    } else {
      console.log('[LOGIN] Validation failed');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mt-8">
        Welcome back
      </Text>

      {/* OAuth Options */}
      <View className="mt-8">
        <OAuthButtons
          onSuccess={() => router.replace("/(tabs)")}
          onError={(error) => setErrors({ form: error })}
        />
      </View>

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
        <Text className="mx-4 text-gray-500 dark:text-gray-400">or</Text>
        <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
      </View>

      {/* Email */}
      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Email
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-700"
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
      {errors.email && (
        <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
      )}

      {/* Password */}
      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2 mt-4">
        Password
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        }`}
        placeholder="Your password"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      {errors.password && (
        <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
      )}

      {/* Forgot Password */}
      <Pressable onPress={() => router.push("/forgot-password")} className="mt-2">
        <Text className="text-green-500 text-right">Forgot password?</Text>
      </Pressable>

      {errors.form && (
        <Text className="text-red-500 text-sm mt-4 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      {/* Login Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-4 ${
          loginMutation.isPending ? "bg-gray-400" : "bg-green-500"
        }`}
        onPress={handleLogin}
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
        )}
      </Pressable>

      {/* Signup Link */}
      <Pressable onPress={() => router.push("/signup")} className="mb-8">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          Don't have an account? <Text className="text-green-500 font-medium">Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}
