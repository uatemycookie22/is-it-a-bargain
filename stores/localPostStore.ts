import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LocalPost = {
  title: string;
  description: string;
  price: number;
  listingUrl?: string;
  localImageUri?: string; // Local file URI (not uploaded yet)
  imageUrl?: string; // CDN URL (after upload)
  category?: string;
};

type LocalPostStore = {
  post: LocalPost | null;
  setPost: (post: LocalPost) => void;
  clearPost: () => void;
  hasPost: () => boolean;
};

export const useLocalPostStore = create<LocalPostStore>()(
  persist(
    (set, get) => ({
      post: null,
      setPost: (post) => set({ post }),
      clearPost: () => set({ post: null }),
      hasPost: () => get().post !== null,
    }),
    {
      name: "local-post-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
