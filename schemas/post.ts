import { z } from "zod";

export const createPostStep1Schema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be under 1000 characters"),
});

export const createPostStep2Schema = z.object({
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
      message: "Price must be at least $1",
    })
    .refine((val) => Number(val) <= 10000000, {
      message: "Price must be under $10,000,000",
    }),
});
