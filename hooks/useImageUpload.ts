import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { getPresignedUrl } from "@/lib/api";

type UploadResult = {
  imageUrl: string;
};

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = async (): Promise<UploadResult | null> => {
    setError(null);

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Permission to access photos is required");
      return null;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    setIsUploading(true);

    try {
      // Get presigned URL
      const contentType = asset.mimeType || "image/jpeg";
      const fileExtension = contentType.split("/")[1];

      const { uploadUrl, imageUrl } = await getPresignedUrl(contentType, fileExtension);

      // Upload to S3
      const imageResponse = await fetch(asset.uri);
      const blob = await imageResponse.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      return { imageUrl };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { pickAndUpload, isUploading, error };
}
