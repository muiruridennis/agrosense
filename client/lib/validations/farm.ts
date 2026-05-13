import { z } from "zod";

export const farmFormSchema = z.object({
  name: z
    .string()
    .min(2, "Farm name must be at least 2 characters")
    .max(100, "Farm name must be less than 100 characters"),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .default(""),

  areaHectares: z
    .number()
    .positive("Area must be a positive number")
    .max(100000, "Area is unrealistically large"),

  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country name too long"),

  region: z
    .string()
    .min(1, "Region is required")
    .max(100, "Region name too long"),

  subRegion: z
    .string()
    .max(100, "Sub-region name too long")
    .optional()
    .default(""),

  timezone: z.string().optional().default("UTC"),
});

export type FarmFormData = z.infer<typeof farmFormSchema>;
