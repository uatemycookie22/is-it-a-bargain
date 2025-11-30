import { create } from "zustand";

type CreatePostStore = {
  title: string;
  description: string;
  price: string;
  errors: Record<string, string>;
  updateData: (updates: Partial<{ title: string; description: string; price: string }>) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetData: () => void;
};

export const useCreatePostStore = create<CreatePostStore>((set) => ({
  title: "",
  description: "",
  price: "",
  errors: {},
  updateData: (updates) => set((state) => ({ ...state, ...updates })),
  setErrors: (errors) => set({ errors }),
  resetData: () => set({ title: "", description: "", price: "", errors: {} }),
}));
