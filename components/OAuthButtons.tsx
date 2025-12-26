import { View, Pressable, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onSuccess: () => void;
  onError?: (error: string) => void;
};

export function OAuthButtons({ onSuccess, onError }: Props) {
  const [loading, setLoading] = useState<"google" | "facebook" | null>(null);

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(provider);
    try {
      const result = await authClient.signIn.social({ 
        provider,
        callbackURL: "/(tabs)" // Will be converted to isitabargain://(tabs) deep link
      });
      if (result.error) {
        onError?.(result.error.message || "OAuth failed");
      } else {
        onSuccess();
      }
    } catch (error: any) {
      onError?.(error.message || "OAuth failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <View className="gap-3">
      <Pressable
        className="flex-row items-center justify-center py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        onPress={() => handleOAuth("google")}
        disabled={loading !== null}
      >
        {loading === "google" ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text className="text-gray-900 dark:text-white font-medium ml-3">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
