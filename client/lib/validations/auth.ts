import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),

    email: z.email("Invalid email address"),

    phone: z
      .string()
      .transform((val) => val.replace(/\s/g, ""))
      .refine((val) => /^\+?[1-9]\d{7,14}$/.test(val), {
        message:
          "Enter a valid phone number (include country code, e.g. +254...)",
      })
      .transform((val) => (val.startsWith("+") ? val : `+${val}`)),
    password: z.string().min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
