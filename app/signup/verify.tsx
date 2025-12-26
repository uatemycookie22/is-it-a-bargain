import { useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSignupStore } from "@/stores/signupStore";
import { authClient } from "@/lib/auth-client";
import { OTPInput } from "@/components/OTPInput";

export default function SignupStep2() {
  const router = useRouter();
  const { email, password, verificationCode, updateData, errors, setErrors, setStep, reset } = useSignupStore();

  console.log('[VERIFY] Component mounted, email:', email, 'code:', verificationCode);

  // If no email, go back to signup
  useEffect(() => {
    if (!email) {
      console.log('[VERIFY] No email found, redirecting to signup');
      router.replace('/signup');
    }
  }, [email, router]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      console.log('[VERIFY] Verifying OTP:', verificationCode, 'for email:', email);
      
      // First check if OTP is valid
      const checkResult = await authClient.emailOtp.checkVerificationOtp({ 
        email, 
        otp: verificationCode,
        type: "email-verification"
      });
      
      console.log('[VERIFY] Check result:', JSON.stringify(checkResult));
      
      if (checkResult.error) {
        const error: any = new Error(checkResult.error.message || 'Invalid OTP');
        error.status = checkResult.error.status;
        throw error;
      }
      
      if (!checkResult.data?.success) {
        throw new Error('Invalid OTP');
      }
      
      // Verify the email
      await authClient.emailOtp.verifyEmail({ email, otp: verificationCode });
      console.log('[VERIFY] Email verified');
      
      // Sign in with email/password to create session
      const signInResult = await authClient.signIn.email({ email, password });
      console.log('[VERIFY] Signed in, result:', JSON.stringify(signInResult));
      
      if (signInResult.error) {
        throw new Error(signInResult.error.message || 'Sign in failed');
      }
      
      // Check if we have a session
      const session = await authClient.getSession();
      console.log('[VERIFY] Session after sign-in:', JSON.stringify(session));
    },
    onSuccess: () => {
      console.log('[VERIFY] Success, navigating to username');
      setStep(3);
      router.push("/signup/username");
    },
    onError: (error: any) => {
      console.error('[VERIFY] Verification failed');
      if (error.status === 429) {
        setErrors({ code: "Too many attempts. Please wait a moment and try again." });
      } else {
        setErrors({ code: "Invalid or expired code. Please try again." });
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      console.log('[VERIFY] Resending OTP to:', email);
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      console.log('[VERIFY] OTP resent successfully');
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

  const handleBack = () => {
    reset();
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mt-8">
        Check your email
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        We sent a verification code to
      </Text>
      <Text className="text-gray-900 dark:text-white text-center font-medium">
        {email}
      </Text>

      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2 mt-8">
        Verification Code
      </Text>
      <OTPInput
        code={verificationCode}
        setCode={(code) => updateData({ verificationCode: code })}
        length={6}
      />
      {errors.code && (
        <Text className="text-red-500 text-sm mt-1 text-center">{errors.code}</Text>
      )}

      <Pressable
        onPress={() => resendMutation.mutate()}
        disabled={resendMutation.isPending}
        className="mt-4"
      >
        <Text className="text-center text-green-500">
          {resendMutation.isPending ? "Sending..." : "Resend code"}
        </Text>
      </Pressable>

      {errors.form && (
        <Text className="text-green-600 text-sm mt-2 text-center">{errors.form}</Text>
      )}

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-8 ${
          verifyMutation.isPending ? "bg-gray-400" : "bg-green-500"
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
