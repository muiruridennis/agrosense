import { z } from "zod";

 export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

export const cleanPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+254" + cleaned.substring(1);
  }
  if (cleaned.startsWith("254") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
};