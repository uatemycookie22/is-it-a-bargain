import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { usernameClient } from "better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://bargain-api.callingallheroes.net";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "isitabargain",
      storagePrefix: "bargain",
      storage: SecureStore,
    }),
    usernameClient(),
    passkeyClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
