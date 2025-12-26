import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSignupStore } from "@/stores/signupStore";
import { authClient, signUp } from "@/lib/auth-client";
import { OAuthButtons } from "@/components/OAuthButtons";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignupStep1() {
  const router = useRouter();
  const { email, password, updateData, errors, setErrors, setStep } = useSignupStore();

  const signupMutation = useMutation({
    mutationFn: async () => {
      console.log('[SIGNUP] Creating account for:', email);
      // Create account WITHOUT auto-login
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bargain-api.callingallheroes.net';
      console.log('[SIGNUP] Using API URL:', apiUrl);
      const response = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'exp://192.168.1.245:8081',
        },
        body: JSON.stringify({ email, password, name: email.split("@")[0] }),
      });
      
      console.log('[SIGNUP] Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[SIGNUP] Signup failed:', error);
        throw new Error(error.error || error.message || 'Signup failed');
      }
      
      console.log('[SIGNUP] Account created, sending OTP...');
      // Send OTP for email verification
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      console.log('[SIGNUP] OTP sent successfully');
    },
    onSuccess: () => {
      console.log('[SIGNUP] Success, navigating to verify');
      setStep(2);
      router.push("/signup/verify");
    },
    onError: (error: Error) => {
      console.error('[SIGNUP] Error:', error);
      if (error.message.includes("already")) {
        setErrors({ email: "Email has already been registered." });
      } else {
        setErrors({ form: error.message });
      }
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

  const handleContinue = () => {
    if (validate()) {
      signupMutation.mutate();
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      {/* OAuth Options */}
      <View className="mt-4">
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
        onChangeText={(text) => updateData({ email: text })}
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
        placeholder="At least 8 characters"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={(text) => updateData({ password: text })}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {errors.password && (
        <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
      )}

      {errors.form && (
        <Text className="text-red-500 text-sm mt-4 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      {/* Continue Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-8 ${
          signupMutation.isPending ? "bg-gray-400" : "bg-green-500"
        }`}
        onPress={handleContinue}
        disabled={signupMutation.isPending}
      >
        {signupMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Continue</Text>
        )}
      </Pressable>

      {/* Login Link */}
      <Pressable onPress={() => router.back()} className="mb-4">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          Already registered? <Text className="text-green-500 font-medium">Sign in</Text>
        </Text>
      </Pressable>
    </View>
  );
}
