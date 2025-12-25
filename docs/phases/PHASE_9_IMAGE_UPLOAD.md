# Phase 9: Image Upload

## Goal
Implement S3 presigned URL image uploads with CloudFront CDN. Users always upload images manually.

## Prerequisites
- Phase 8 complete (anonymous flow)
- AWS account with S3 and CloudFront access
- Access to personal-website-cdk repo

---

## Steps

### 9.1 Create S3 Bucket (CDK)

**File:** `personal-website-cdk/lib/dnd/constructs/bargain-api-s3.ts` (in CDK repo)

```ts
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { RemovalPolicy, Duration } from "aws-cdk-lib";

export class BargainApiS3 extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 Bucket for images
    this.bucket = new s3.Bucket(this, "ImagesBucket", {
      bucketName: "bargain-api-images",
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          // Delete incomplete multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      comment: "Bargain API Images CDN",
    });
  }
}
```

### 9.2 Add S3 to Application Stack

**File:** Update `DndApplicationStack` in CDK repo

```ts
// In DndApplicationStack constructor:
const bargainS3 = new BargainApiS3(this, "BargainApiS3");

// Output the values needed for .env
new CfnOutput(this, "BargainImagesBucket", {
  value: bargainS3.bucket.bucketName,
});
new CfnOutput(this, "BargainCloudfrontUrl", {
  value: `https://${bargainS3.distribution.distributionDomainName}`,
});
```

### 9.3 Update IAM Role for S3 Access

Add S3 permissions to the GitHub Actions role or create a separate role for the API:

```ts
// In BargainApiCicdStack or create new policy
const s3Policy = new iam.PolicyStatement({
  actions: ["s3:PutObject", "s3:GetObject"],
  resources: [`arn:aws:s3:::bargain-api-images/*`],
});
```

### 9.4 Create Image Upload API Route

**File:** `app/api/images/upload+api.ts`

```ts
import { requireAuth } from "@/lib/auth-server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "bargain-api-images";
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

export async function POST(request: Request) {
  const session = await requireAuth(request);
  const body = await request.json();

  const { contentType, fileExtension } = body;

  // Validate content type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(contentType)) {
    return Response.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
      { status: 400 }
    );
  }

  // Generate unique key
  const key = `posts/${session.user.id}/${nanoid()}.${fileExtension || "jpg"}`;

  // Create presigned URL
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes
  });

  // Return both presigned URL and final CDN URL
  const cdnUrl = CLOUDFRONT_URL
    ? `${CLOUDFRONT_URL}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  return Response.json({
    uploadUrl: presignedUrl,
    imageUrl: cdnUrl,
    key,
  });
}
```

### 9.5 Install AWS SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 9.6 Create Image Upload Hook

**File:** `hooks/useImageUpload.ts`

```ts
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      const presignedResponse = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contentType, fileExtension }),
      });

      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, imageUrl } = await presignedResponse.json();

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
```

### 9.7 Install Expo Image Picker

```bash
npx expo install expo-image-picker
```

### 9.8 Create Image Upload Step in Create Flow

**File:** `app/create/image.tsx`

```tsx
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Upload, Camera } from "lucide-react-native";
import { useCreatePostStore } from "@/stores/createPostStore";
import { useImageUpload } from "@/hooks/useImageUpload";
import { colors } from "@/theme/colors";

export default function CreateImageStep() {
  const router = useRouter();
  const { imageUrl, updateData, errors, setErrors } = useCreatePostStore();
  const { pickAndUpload, isUploading, error } = useImageUpload();

  const handlePickImage = async () => {
    const result = await pickAndUpload();
    if (result) {
      updateData({ imageUrl: result.imageUrl });
      setErrors({});
    }
  };

  const handleContinue = () => {
    if (!imageUrl) {
      setErrors({ image: "Please upload an image" });
      return;
    }
    router.push("/create/details");
  };

  return (
    <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      <Text className="text-xl font-bold text-text-primary dark:text-white text-center mt-4">
        Add a photo
      </Text>
      <Text className="text-text-secondary dark:text-gray-400 text-center mt-2">
        Upload a photo of the listing
      </Text>

      {/* Image Preview or Upload Button */}
      <Pressable
        className={`mt-8 h-64 rounded-xl border-2 border-dashed items-center justify-center overflow-hidden ${
          errors.image
            ? "border-red-500"
            : "border-border-primary dark:border-gray-700"
        }`}
        onPress={handlePickImage}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center">
            <Upload color={colors.text.tertiary} size={48} />
            <Text className="text-text-secondary dark:text-gray-400 mt-4">
              Tap to upload image
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

      {imageUrl && (
        <Pressable onPress={handlePickImage} className="mt-4">
          <Text className="text-primary text-center">Change image</Text>
        </Pressable>
      )}

      <View className="flex-1" />

      <Pressable
        className={`py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 ${
          !imageUrl || isUploading ? "bg-gray-400" : "bg-primary"
        }`}
        onPress={handleContinue}
        disabled={!imageUrl || isUploading}
      >
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </View>
  );
}
```

### 9.10 Update Create Flow - URL Step

**File:** `app/create/index.tsx` (update)

User enters listing URL, then proceeds to image upload (no scraping).

```tsx
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { z } from "zod";

const urlSchema = z.string().url("Please enter a valid URL");

export default function CreateUrlStep() {
  const router = useRouter();
  const { listingUrl, updateData, errors, setErrors } = useCreatePostStore();

  const handleContinue = () => {
    const result = urlSchema.safeParse(listingUrl);
    if (!result.success) {
      setErrors({ url: result.error.issues[0].message });
      return;
    }
    setErrors({});
    router.push("/create/image");
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Post",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary">Cancel</Text>
            </Pressable>
          ),
        }}
      />
      <View className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
        <Text className="text-xl font-bold text-text-primary dark:text-white text-center mt-4">
          Paste the listing URL
        </Text>

        <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-8">
          Listing URL
        </Text>
        <TextInput
          className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
            errors.url ? "border-red-500" : "border-border-primary dark:border-gray-700"
          }`}
          placeholder="https://facebook.com/marketplace/..."
          placeholderTextColor="#9ca3af"
          value={listingUrl}
          onChangeText={(text) => updateData({ listingUrl: text })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {errors.url && (
          <Text className="text-red-500 text-sm mt-1">{errors.url}</Text>
        )}

        <View className="flex-1" />

        <Pressable
          className="py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 bg-primary"
          onPress={handleContinue}
        >
          <Text className="text-white text-center font-semibold text-lg">Continue</Text>
        </Pressable>
      </View>
    </>
  );
}
```

### 9.11 Create Details Step

**File:** `app/create/details.tsx`

```tsx
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useCreatePostStore } from "@/stores/createPostStore";
import { z } from "zod";

const detailsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  price: z.string().min(1, "Price is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 1,
    "Price must be at least $1"
  ),
});

export default function CreateDetailsStep() {
  const router = useRouter();
  const { title, description, price, updateData, errors, setErrors } = useCreatePostStore();

  const handleContinue = () => {
    const result = detailsSchema.safeParse({ title, description, price });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    router.push("/create/review");
  };

  return (
    <ScrollView className="flex-1 bg-background-primary dark:bg-gray-900 p-4">
      {/* Title */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2">Title</Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 ${
          errors.title ? "border-red-500" : "border-border-primary dark:border-gray-700"
        }`}
        placeholder="e.g., 2019 Honda Civic LX"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={(text) => updateData({ title: text })}
        maxLength={100}
      />
      {errors.title && <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>}

      {/* Description */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-6">Description</Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-text-primary dark:text-white bg-background-primary dark:bg-gray-800 h-32 ${
          errors.description ? "border-red-500" : "border-border-primary dark:border-gray-700"
        }`}
        placeholder="Describe the listing..."
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={(text) => updateData({ description: text })}
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />
      {errors.description && <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>}

      {/* Price */}
      <Text className="text-sm font-medium text-text-primary dark:text-white mb-2 mt-6">Price</Text>
      <View className={`flex-row items-center border rounded-xl px-4 bg-background-primary dark:bg-gray-800 ${
        errors.price ? "border-red-500" : "border-border-primary dark:border-gray-700"
      }`}>
        <Text className="text-xl text-text-secondary">$</Text>
        <TextInput
          className="flex-1 py-3 px-2 text-2xl text-text-primary dark:text-white"
          placeholder="0"
          placeholderTextColor="#9ca3af"
          value={price}
          onChangeText={(text) => updateData({ price: text.replace(/[^0-9]/g, "") })}
          keyboardType="numeric"
        />
      </View>
      {errors.price && <Text className="text-red-500 text-sm mt-1">{errors.price}</Text>}

      <View className="h-32" />

      <Pressable className="py-4 rounded-2xl w-4/5 self-center mb-safe-or-8 bg-primary" onPress={handleContinue}>
        <Text className="text-white text-center font-semibold text-lg">Continue</Text>
      </Pressable>
    </ScrollView>
  );
}
```

### 9.12 Update Create Layout

**File:** `app/create/_layout.tsx`

```tsx
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function CreateLayout() {
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
      <Stack.Screen name="index" options={{ title: "New Post" }} />
      <Stack.Screen name="image" options={{ title: "Add Photo" }} />
      <Stack.Screen name="details" options={{ title: "Details" }} />
      <Stack.Screen name="review" options={{ title: "Review" }} />
    </Stack>
  );
}
```

---

## Deploy

### 9.13 Deploy CDK (S3 + CloudFront)

In the personal-website-cdk repo:

```bash
cd personal-website-cdk
npm run build
cdk deploy DndApplicationStack
```

Note the outputs:
- `BargainImagesBucket` - S3 bucket name
- `BargainCloudfrontUrl` - CloudFront URL

### 9.14 Add GitHub Secrets

- `AWS_S3_BUCKET` - From CDK output
- `CLOUDFRONT_URL` - From CDK output

### 9.15 Update deploy.yml

Add to podman run command:
```yaml
-e AWS_REGION=us-east-1 \
-e AWS_S3_BUCKET=${{ secrets.AWS_S3_BUCKET }} \
-e CLOUDFRONT_URL=${{ secrets.CLOUDFRONT_URL }} \
```

### 9.16 Deploy App

```bash
git add .
git commit -m "Phase 9: Image upload with S3 + CloudFront"
git push origin main
```

---

## File Structure After Phase 9

```
is-it-a-bargain/
├── app/
│   ├── api/
│   │   └── images/
│   │       └── upload+api.ts  # NEW - Presigned URL endpoint
│   └── create/
│       └── image.tsx          # NEW - Image upload step
├── hooks/
│   └── useImageUpload.ts      # NEW - Image upload hook
├── stores/
│   └── createPostStore.ts     # UPDATED - Added imageUrl
└── ... existing files
```

---

## Test Cases

### TC9.1: Get Presigned URL
- [ ] POST `/api/images/upload` with contentType
- [ ] Should return uploadUrl and imageUrl
- [ ] uploadUrl should be valid S3 presigned URL

### TC9.2: Upload Image to S3
- [ ] Get presigned URL
- [ ] PUT image blob to uploadUrl
- [ ] Should succeed (200/204)
- [ ] Image should be accessible at imageUrl

### TC9.3: Image Picker Permission
- [ ] Tap upload button
- [ ] Should request photo library permission
- [ ] After granting, should open picker

### TC9.4: Image Upload Flow
- [ ] Pick image from library
- [ ] Should show loading indicator
- [ ] After upload, should show image preview
- [ ] Should be able to change image

### TC9.5: Invalid File Type
- [ ] Try to upload non-image file
- [ ] Should show error "Invalid file type"

### TC9.6: CloudFront URL
- [ ] Upload image
- [ ] imageUrl should use CloudFront domain
- [ ] Image should load from CDN

### TC9.7: Upload Without Auth
- [ ] POST `/api/images/upload` without session
- [ ] Should return 401 Unauthorized

---

## Troubleshooting

### "Access Denied" on S3 upload
- Check IAM permissions include s3:PutObject
- Verify bucket name matches
- Check CORS configuration on bucket

### Image not loading from CloudFront
- Verify CloudFront distribution is deployed
- Check origin access identity permissions
- May take a few minutes for distribution to propagate

### "Permission denied" on image picker
- Ensure expo-image-picker is installed
- Check Info.plist has NSPhotoLibraryUsageDescription (iOS)
- Check AndroidManifest has READ_EXTERNAL_STORAGE (Android)

### Presigned URL expired
- URLs expire after 15 minutes
- Get a new URL if upload takes too long
