# Phase 7: Login UI

## Goal
Create login screen with email/password and OAuth options. Include forgot password flow.

## Prerequisites
- Phase 6 complete (signup UI)

---

## Steps

### 7.1 Create Login Screen

**File:** `app/login.tsx`

```tsx
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
      await signIn.email({ email, password });
    },
    onSuccess: () => {
      router.replace("/(tabs)");
    },
    onError: (error: Error) => {
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
    if (validate()) {
      loginMutation.mutate();
    }
  };

  const handleOAuthSuccess = () => {
    router.replace("/(tabs)");
  };

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-text-primary dark:text-white text-center mt-8">
        Welcome back
      </Text>

      {/* OAuth Options */}
      <View className="mt-8">
        <OAuthButtons onSuccess={handleOAuthSuccess} />
      </View>

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-border-primary dark:bg-gray-700" />
        <Text className="mx-4 text-text-secondary dark:text-gray-400">or</Text>
        <View className="flex-1 h-px bg-border-primary dark:bg-gray-700" />
      </View>

      {/* Email */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2">
        Email
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
          errors.email ? "border-red-500" : "border-border-primary dark:border-gray-700"
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
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-4">
        Password
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
          errors.password ? "border-red-500" : "border-border-primary dark:border-gray-700"
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
        <Text className="text-primary text-right">Forgot password?</Text>
      </Pressable>

      {errors.form && (
        <Text className="text-red-500 text-sm mt-4 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      {/* Login Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-4 ${
          loginMutation.isPending ? "bg-gray-400" : "bg-primary"
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
      <Pressable onPress={() => router.push("/signup")} className="mb-safe-or-8">
        <Text className="text-center text-text-secondary dark:text-gray-400">
          Don't have an account? <Text className="text-primary font-medium">Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}
```

### 7.2 Create Forgot Password Screen

**File:** `app/forgot-password.tsx`

```tsx
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
      await authClient.forgetPassword({ email });
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
      <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4 justify-center items-center">
        <Text className="text-2xl font-bold text-text-primary dark:text-white text-center">
          Check your email
        </Text>
        <Text className="text-text-secondary dark:text-gray-400 text-center mt-4 px-8">
          We sent a password reset link to {email}
        </Text>
        <Pressable
          className="mt-8 py-4 px-8 rounded-2xl bg-primary"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Back to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-text-primary dark:text-white text-center mt-8">
        Reset password
      </Text>
      <Text className="text-text-secondary dark:text-gray-400 text-center mt-2">
        Enter your email and we'll send you a reset link
      </Text>

      {/* Email */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-8">
        Email
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
          error ? "border-red-500" : "border-border-primary dark:border-gray-700"
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
          sendMutation.isPending ? "bg-gray-400" : "bg-primary"
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
      <Pressable onPress={() => router.back()} className="mb-safe-or-8">
        <Text className="text-center text-primary">Back to Login</Text>
      </Pressable>
    </View>
  );
}
```

### 7.3 Create Reset Password Screen (Deep Link)

**File:** `app/reset-password.tsx`

```tsx
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      await authClient.resetPassword({ token, newPassword: password });
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

  if (success) {
    return (
      <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4 justify-center items-center">
        <Text className="text-2xl font-bold text-text-primary dark:text-white text-center">
          Password reset!
        </Text>
        <Text className="text-text-secondary dark:text-gray-400 text-center mt-4">
          You can now sign in with your new password
        </Text>
        <Pressable
          className="mt-8 py-4 px-8 rounded-2xl bg-primary"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-white font-semibold">Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-text-primary dark:text-white text-center mt-8">
        Set new password
      </Text>

      {/* New Password */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-8">
        New Password
      </Text>
      <TextInput
        className="border border-border-primary dark:border-gray-700 rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800"
        placeholder="At least 8 characters"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />

      {/* Confirm Password */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-4">
        Confirm Password
      </Text>
      <TextInput
        className="border border-border-primary dark:border-gray-700 rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800"
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
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          resetMutation.isPending ? "bg-gray-400" : "bg-primary"
        }`}
        onPress={handleReset}
        disabled={resetMutation.isPending}
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
```

### 7.4 Update Root Layout for Auth Routes

**File:** `app/_layout.tsx` (update)

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
          headerTintColor: isDark ? "#ffffff" : "#000000",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="login"
          options={{ headerShown: true, title: "Sign In" }}
        />
        <Stack.Screen name="signup" />
        <Stack.Screen
          name="forgot-password"
          options={{ headerShown: true, title: "Reset Password" }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ headerShown: true, title: "New Password" }}
        />
        <Stack.Screen
          name="create"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="profile"
          options={{ headerShown: true, title: "Profile" }}
        />
        <Stack.Screen name="post" />
        <Stack.Screen name="post-created" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
```

---

## Deploy

```bash
git add .
git commit -m "Phase 7: Login UI"
git push origin main
```

---

## File Structure After Phase 7

```
is-it-a-bargain/
├── app/
│   ├── _layout.tsx            # UPDATED - Auth routes
│   ├── login.tsx              # NEW - Login screen
│   ├── forgot-password.tsx    # NEW - Forgot password
│   ├── reset-password.tsx     # NEW - Reset password (deep link)
│   └── signup/
│       └── ...
└── ... existing files
```

---

## Test Cases

### TC7.1: Email Login
- [ ] Open login screen
- [ ] Enter valid email and password
- [ ] Tap Sign In
- [ ] Should navigate to home (tabs)

### TC7.2: Invalid Credentials
- [ ] Enter wrong password
- [ ] Tap Sign In
- [ ] Should show "Invalid email or password"

### TC7.3: OAuth Login (Google)
- [ ] Tap "Continue with Google"
- [ ] Complete Google auth
- [ ] Should navigate to home (tabs)

### TC7.4: Forgot Password Flow
- [ ] Tap "Forgot password?"
- [ ] Enter email
- [ ] Tap "Send Reset Link"
- [ ] Should show "Check your email" message
- [ ] Check console for magic link

### TC7.5: Reset Password
- [ ] Click reset link from email
- [ ] Enter new password
- [ ] Confirm password
- [ ] Tap "Reset Password"
- [ ] Should show success and link to login

### TC7.6: Password Validation on Reset
- [ ] Enter password < 8 chars
- [ ] Should show length error
- [ ] Enter mismatched passwords
- [ ] Should show "Passwords do not match"

### TC7.7: Navigation Between Auth Screens
- [ ] From login, tap "Sign up"
- [ ] Should go to signup
- [ ] From signup, tap "Sign in"
- [ ] Should go to login

---

## Troubleshooting

### "Invalid email or password" when credentials are correct
- Check BetterAuth is configured correctly
- Verify user exists in database
- Check password was hashed correctly on signup

### OAuth not working
- Verify OAuth credentials in .env
- Check redirect URIs match

### Reset link not working
- Links expire after 1 hour
- Check token is being passed correctly in URL
