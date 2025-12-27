import { create } from "zustand";

type CreatePostStore = {
  listingUrl: string;
  localImageUri: string;
  imageUrl: string;
  title: string;
  description: string;
  price: string;
  errors: Record<string, string>;
  updateData: (updates: Partial<{ listingUrl: string; localImageUri: string; imageUrl: string; title: string; description: string; price: string }>) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetData: () => void;
};

export const useCreatePostStore = create<CreatePostStore>((set) => ({
  listingUrl: "",
  localImageUri: "",
  imageUrl: "",
  title: "",
  description: "",
  price: "",
  errors: {},
  updateData: (updates) => set((state) => ({ ...state, ...updates })),
  setErrors: (errors) => set({ errors }),
  resetData: () => set({ listingUrl: "", localImageUri: "", imageUrl: "", title: "", description: "", price: "", errors: {} }),
}));
