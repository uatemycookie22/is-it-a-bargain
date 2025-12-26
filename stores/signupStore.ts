import { create } from "zustand";

type SignupData = {
  email: string;
  password: string;
  verificationCode: string;
  username: string;
};

type SignupStore = SignupData & {
  step: 1 | 2 | 3;
  errors: Record<string, string>;
  setStep: (step: 1 | 2 | 3) => void;
  updateData: (updates: Partial<SignupData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  reset: () => void;
};

const initialData: SignupData = {
  email: "",
  password: "",
  verificationCode: "",
  username: "",
};

export const useSignupStore = create<SignupStore>((set) => ({
  ...initialData,
  step: 1,
  errors: {},
  setStep: (step) => set({ step }),
  updateData: (updates) => set((state) => ({ ...state, ...updates })),
  setErrors: (errors) => set({ errors }),
  reset: () => set({ ...initialData, step: 1, errors: {} }),
}));
