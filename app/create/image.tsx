import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useCreatePostStore } from "@/stores/createPostStore";
import { useAuth } from "@/contexts/AuthContext";
import { useImageUpload } from "@/hooks/useImageUpload";

export default function CreateImageStep() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { localImageUri, imageUrl, updateData, errors, setErrors } = useCreatePostStore();
  const { pickAndUpload, isUploading, error } = useImageUpload();
  const [isPicking, setIsPicking] = useState(false);

  const displayImage = imageUrl || localImageUri;

  const handlePickImage = async () => {
    setErrors({});

    if (isAuthenticated) {
      // Authenticated: upload immediately
      const result = await pickAndUpload();
      if (result) {
        updateData({ imageUrl: result.imageUrl, localImageUri: "" });
      }
    } else {
      // Anonymous: just pick and store locally
      setIsPicking(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrors({ image: "Permission to access photos is required" });
        setIsPicking(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      setIsPicking(false);
      if (!result.canceled) {
        updateData({ localImageUri: result.assets[0].uri, imageUrl: "" });
      }
    }
  };

  const handleContinue = () => {
    if (!displayImage) {
      setErrors({ image: "Please upload an image" });
      return;
    }
    router.push("/create/details");
  };

  const isLoading = isUploading || isPicking;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mt-4">
        Add a photo
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
        Upload a photo of the listing
      </Text>

      <Pressable
        className={`mt-8 h-64 rounded-xl border-2 border-dashed items-center justify-center overflow-hidden ${
          errors.image ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        }`}
        onPress={handlePickImage}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#22c55e" />
        ) : displayImage ? (
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center">
            <Upload color="#9ca3af" size={48} />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">
              Tap to select image
            </Text>
          </View>
        )}
      </Pressable>

      {errors.image && (
        <Text className="text-red-500 text-sm mt-2 text-center">{errors.image}</Text>
      )}
      {error && (
        <Text className="text-red-500 text-sm mt-2 text-center">{error}</Text>
      )}

      {displayImage && (
        <Pressable onPress={handlePickImage} className="mt-4">
          <Text className="text-green-500 text-center">Change image</Text>
        </Pressable>
      )}

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          !displayImage || isLoading ? "bg-gray-400" : "bg-green-500"
        }`}
        onPress={handleContinue}
        disabled={!displayImage || isLoading}
      >
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}
