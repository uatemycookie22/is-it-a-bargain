import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient, usernameClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./constants";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: "isitabargain",
      storagePrefix: "bargain",
      cookiePrefix: "better-auth",
      storage: SecureStore,
    }),
    emailOTPClient(),
    usernameClient(),
  ],
});

export const { signUp, signIn, signOut, useSession } = authClient;
