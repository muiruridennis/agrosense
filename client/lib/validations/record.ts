import { z } from "zod";

export const recordTypeOptions = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
  { label: "Treatment", value: "treatment" },
  { label: "Feed", value: "feed" },
  { label: "Harvest", value: "harvest" },
  { label: "Labor", value: "labor" },
  { label: "Equipment", value: "equipment" },
] as const;

export const expenseCategoryOptions = [
  { label: "Seed", value: "seed" },
  { label: "Fertilizer", value: "fertilizer" },
  { label: "Pesticide", value: "pesticide" },
  { label: "Irrigation", value: "irrigation" },
  { label: "Veterinary", value: "veterinary" },
  { label: "Animal feed", value: "animal_feed" },
  { label: "Transport", value: "transport" },
  { label: "Storage", value: "storage" },
  { label: "Labor", value: "labor" },
  { label: "Equipment", value: "equipment" },
  { label: "Other expense", value: "other_expense" },
] as const;

export const incomeCategoryOptions = [
  { label: "Crop sale", value: "crop_sale" },
  { label: "Livestock sale", value: "livestock_sale" },
  { label: "Dairy", value: "dairy" },
  { label: "Eggs", value: "eggs" },
  { label: "Other income", value: "other_income" },
] as const;

export const recordFormSchema = z.object({
  recordType: z.enum([
    "expense",
    "income",
    "treatment",
    "feed",
    "harvest",
    "labor",
    "equipment",
  ]),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().min(1).max(3).default("KES"),
  recordedAt: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Recorded date is required")
    .default(new Date().toISOString().slice(0, 10)),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .default(""),
});

export type RecordFormData = z.infer<typeof recordFormSchema>;
