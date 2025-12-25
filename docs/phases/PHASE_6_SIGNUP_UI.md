# Phase 6: Signup Wizard UI

## Goal
Create multi-step signup wizard: Email+Password → Verify Code → Username. Include OAuth options.

## Prerequisites
- Phase 5 complete (user API)
- OAuth credentials configured (Google, Apple, Facebook)

---

## Steps

### 6.1 Set Up OAuth Credentials

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials (iOS, Android, Web)
5. Add redirect URIs

**Apple:**
1. Go to [Apple Developer](https://developer.apple.com)
2. Create App ID with Sign in with Apple capability
3. Create Service ID for web
4. Generate private key

**Facebook:**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create app
3. Add Facebook Login product
4. Configure OAuth settings

Add credentials to `.env`:
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx
FACEBOOK_CLIENT_ID=xxx
FACEBOOK_CLIENT_SECRET=xxx
```

### 6.2 Create Signup Store

**File:** `stores/signupStore.ts`

```ts
import { create } from "zustand";

type SignupData = {
  email: string;
  password: string;
  verificationCode: string;
  username: string;
};

type SignupStore = SignupData & {
  step: 1 | 2 | 3;
  isOAuth: boolean;
  oAuthUserId: string | null;
  errors: Record<string, string>;
  setStep: (step: 1 | 2 | 3) => void;
  updateData: (updates: Partial<SignupData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setOAuthUser: (userId: string) => void;
  reset: () => void;
};

const initialData: SignupData = {
  email: "",
  password: "",
  verificationCode: "",
  username: "",
};

export const useSignupStore = create<SignupStore>((set) => ({
  ...initialData,
  step: 1,
  isOAuth: false,
  oAuthUserId: null,
  errors: {},
  setStep: (step) => set({ step }),
  updateData: (updates) => set((state) => ({ ...state, ...updates })),
  setErrors: (errors) => set({ errors }),
  setOAuthUser: (userId) => set({ isOAuth: true, oAuthUserId: userId, step: 3 }),
  reset: () => set({ ...initialData, step: 1, isOAuth: false, oAuthUserId: null, errors: {} }),
}));
```

### 6.3 Create Signup Layout

**File:** `app/signup/_layout.tsx`

```tsx
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function SignupLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDark ? "#1f2937" : "#ffffff" },
        headerTintColor: isDark ? "#ffffff" : "#000000",
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Create Account" }} />
      <Stack.Screen name="verify" options={{ title: "Verify Email" }} />
      <Stack.Screen name="username" options={{ title: "Choose Username" }} />
    </Stack>
  );
}
```

### 6.4 Create Step 1: Email & Password

**File:** `app/signup/index.tsx`

```tsx
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSignupStore } from "@/stores/signupStore";
import { signUp } from "@/lib/auth-client";
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
      await signUp.email({ email, password, name: email.split("@")[0] });
    },
    onSuccess: () => {
      setStep(2);
      router.push("/signup/verify");
    },
    onError: (error: Error) => {
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
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      {/* OAuth Options */}
      <OAuthButtons onSuccess={(userId) => {
        useSignupStore.getState().setOAuthUser(userId);
        router.push("/signup/username");
      }} />

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
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-4">
        Password
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
          errors.password ? "border-red-500" : "border-border-primary dark:border-gray-700"
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
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          signupMutation.isPending ? "bg-gray-400" : "bg-primary"
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
      <Pressable onPress={() => router.push("/login")} className="mb-4">
        <Text className="text-center text-text-secondary dark:text-gray-400">
          Already registered? <Text className="text-primary font-medium">Sign in</Text>
        </Text>
      </Pressable>
    </View>
  );
}
```

### 6.5 Create Step 2: Verify Email

**File:** `app/signup/verify.tsx`

```tsx
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSignupStore } from "@/stores/signupStore";
import { authClient } from "@/lib/auth-client";

export default function SignupStep2() {
  const router = useRouter();
  const { email, verificationCode, updateData, errors, setErrors, setStep } = useSignupStore();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      await authClient.verifyEmail({ code: verificationCode });
    },
    onSuccess: () => {
      setStep(3);
      router.push("/signup/username");
    },
    onError: (error: Error) => {
      setErrors({ code: "Invalid or expired code. Please try again." });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      await authClient.sendVerificationEmail({ email });
    },
    onSuccess: () => {
      setErrors({ form: "Verification code sent!" });
    },
  });

  const handleVerify = () => {
    if (verificationCode.length < 6) {
      setErrors({ code: "Please enter the 6-digit code" });
      return;
    }
    setErrors({});
    verifyMutation.mutate();
  };

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-text-primary dark:text-white text-center mt-8">
        Check your email
      </Text>
      <Text className="text-text-secondary dark:text-gray-400 text-center mt-2">
        We sent a verification code to
      </Text>
      <Text className="text-text-primary dark:text-white text-center font-medium">
        {email}
      </Text>

      {/* Code Input */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-8">
        Verification Code
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-2xl text-center tracking-widest text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
          errors.code ? "border-red-500" : "border-border-primary dark:border-gray-700"
        }`}
        placeholder="000000"
        placeholderTextColor="#9ca3af"
        value={verificationCode}
        onChangeText={(text) => updateData({ verificationCode: text.replace(/\D/g, "").slice(0, 6) })}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      {errors.code && (
        <Text className="text-red-500 text-sm mt-1 text-center">{errors.code}</Text>
      )}

      {/* Resend */}
      <Pressable
        onPress={() => resendMutation.mutate()}
        disabled={resendMutation.isPending}
        className="mt-4"
      >
        <Text className="text-center text-primary">
          {resendMutation.isPending ? "Sending..." : "Resend code"}
        </Text>
      </Pressable>

      {errors.form && (
        <Text className="text-green-600 text-sm mt-2 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      {/* Verify Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          verifyMutation.isPending ? "bg-gray-400" : "bg-primary"
        }`}
        onPress={handleVerify}
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Verify</Text>
        )}
      </Pressable>
    </View>
  );
}
```

### 6.6 Create Step 3: Username

**File:** `app/signup/username.tsx`

```tsx
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSignupStore } from "@/stores/signupStore";
import { checkUsernameAvailable, updateCurrentUser } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

export default function SignupStep3() {
  const router = useRouter();
  const { username, updateData, errors, setErrors, reset } = useSignupStore();
  const [isChecking, setIsChecking] = useState(false);

  const debouncedUsername = useDebounce(username, 500);

  // Check availability when username changes
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
      // BetterAuth username plugin handles this
      await updateCurrentUser({ username: username.toLowerCase() });
    },
    onSuccess: () => {
      reset();
      router.replace("/(tabs)");
    },
    onError: (error: Error) => {
      setErrors({ form: error.message });
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
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-text-primary dark:text-white text-center mt-8">
        Choose a username
      </Text>
      <Text className="text-text-secondary dark:text-gray-400 text-center mt-2">
        This is how others will see you
      </Text>

      {/* Username Input */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-8">
        Username
      </Text>
      <View className="relative">
        <TextInput
          className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
            errors.username
              ? "border-red-500"
              : isAvailable
              ? "border-green-500"
              : "border-border-primary dark:border-gray-700"
          }`}
          placeholder="cooluser123"
          placeholderTextColor="#9ca3af"
          value={username}
          onChangeText={(text) => updateData({ username: text.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
      </View>
      {errors.username && (
        <Text className="text-red-500 text-sm mt-1">{errors.username}</Text>
      )}
      {isAvailable && (
        <Text className="text-green-600 text-sm mt-1">Username is available!</Text>
      )}
      <Text className="text-text-tertiary text-xs mt-1">
        3-20 characters, letters, numbers, underscores only
      </Text>

      {errors.form && (
        <Text className="text-red-500 text-sm mt-4 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      {/* Complete Button */}
      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          saveMutation.isPending || !isAvailable ? "bg-gray-400" : "bg-primary"
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
```

### 6.7 Create OAuth Buttons Component

**File:** `components/OAuthButtons.tsx`

```tsx
import { View, Pressable, Text, Image } from "react-native";
import { signIn } from "@/lib/auth-client";

type Props = {
  onSuccess: (userId: string) => void;
};

export function OAuthButtons({ onSuccess }: Props) {
  const handleOAuth = async (provider: "google" | "apple" | "facebook") => {
    try {
      const result = await signIn.social({ provider });
      if (result.user) {
        onSuccess(result.user.id);
      }
    } catch (error) {
      console.error("OAuth error:", error);
    }
  };

  return (
    <View className="gap-3">
      <Pressable
        className="flex-row items-center justify-center py-3 px-4 rounded-xl border border-border-primary dark:border-gray-700 bg-background-primary dark:bg-gray-800"
        onPress={() => handleOAuth("google")}
      >
        <Image
          source={require("@/assets/images/google-logo.png")}
          className="w-5 h-5 mr-3"
        />
        <Text className="text-text-primary dark:text-white font-medium">
          Continue with Google
        </Text>
      </Pressable>

      <Pressable
        className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-black"
        onPress={() => handleOAuth("apple")}
      >
        <Image
          source={require("@/assets/images/apple-logo.png")}
          className="w-5 h-5 mr-3"
          style={{ tintColor: "#fff" }}
        />
        <Text className="text-white font-medium">Continue with Apple</Text>
      </Pressable>

      <Pressable
        className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-[#1877F2]"
        onPress={() => handleOAuth("facebook")}
      >
        <Image
          source={require("@/assets/images/facebook-logo.png")}
          className="w-5 h-5 mr-3"
        />
        <Text className="text-white font-medium">Continue with Facebook</Text>
      </Pressable>
    </View>
  );
}
```

### 6.8 Create useDebounce Hook

**File:** `hooks/useDebounce.ts`

```ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### 6.9 Add OAuth Logo Assets

Download and add to `assets/images/`:
- `google-logo.png`
- `apple-logo.png`
- `facebook-logo.png`

---

## Deploy

### Add OAuth GitHub Secrets
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

### Update deploy.yml
Add OAuth env vars to podman run command.

```bash
git add .
git commit -m "Phase 6: Signup wizard UI"
git push origin main
```

---

## File Structure After Phase 6

```
is-it-a-bargain/
├── app/
│   └── signup/
│       ├── _layout.tsx    # NEW - Signup stack
│       ├── index.tsx      # NEW - Step 1: Email/Password
│       ├── verify.tsx     # NEW - Step 2: Verify code
│       └── username.tsx   # NEW - Step 3: Username
├── components/
│   └── OAuthButtons.tsx   # NEW - OAuth provider buttons
├── stores/
│   └── signupStore.ts     # NEW - Signup wizard state
├── hooks/
│   └── useDebounce.ts     # NEW - Debounce hook
├── assets/
│   └── images/
│       ├── google-logo.png    # NEW
│       ├── apple-logo.png     # NEW
│       └── facebook-logo.png  # NEW
└── ... existing files
```

---

## Test Cases

### TC6.1: Email Signup Flow
- [ ] Open signup screen
- [ ] Enter valid email and password
- [ ] Tap Continue
- [ ] Should navigate to verify screen
- [ ] Check console for verification code
- [ ] Enter code
- [ ] Should navigate to username screen
- [ ] Enter valid username
- [ ] Tap Complete
- [ ] Should navigate to home (tabs)

### TC6.2: Email Validation
- [ ] Enter invalid email format
- [ ] Tap Continue
- [ ] Should show "Invalid email address" error

### TC6.3: Password Validation
- [ ] Enter password < 8 characters
- [ ] Tap Continue
- [ ] Should show password length error

### TC6.4: Duplicate Email
- [ ] Try to sign up with existing email
- [ ] Should show "Email has already been registered"

### TC6.5: Username Availability
- [ ] Enter username that's taken
- [ ] Should show "Username is taken"
- [ ] Enter available username
- [ ] Should show "Username is available!"

### TC6.6: Username Validation
- [ ] Enter username < 3 chars
- [ ] Should show length error
- [ ] Enter username with special chars
- [ ] Should auto-remove invalid chars

### TC6.7: OAuth Signup (Google)
- [ ] Tap "Continue with Google"
- [ ] Complete Google auth
- [ ] Should skip to username step
- [ ] Complete username
- [ ] Should be logged in

### TC6.8: Resend Verification Code
- [ ] On verify screen, tap "Resend code"
- [ ] Should show "Verification code sent!"
- [ ] Check console for new code

---

## Troubleshooting

### OAuth popup doesn't open
- Check OAuth credentials in .env
- Verify redirect URIs configured in provider console

### "Invalid code" on verification
- Code expires after 10 minutes
- Tap resend to get new code

### Username check not working
- Check `/api/users/username-available` endpoint
- Verify debounce is working (wait 500ms after typing)
