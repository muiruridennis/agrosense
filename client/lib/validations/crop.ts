import { z } from "zod";

export const cropFormSchema = z.object({
  cropType: z
    .string()
    .min(1, "Crop type is required")
    .max(100, "Crop type is too long"),

  variety: z.string().max(100, "Variety is too long").optional().default(""),

  plotId: z.string().min(1, "Plot is required"),

  status: z
    .enum(["planned", "planted", "growing", "mature", "harvested"])
    .default("planned"),

  currentStage: z
    .string()
    .max(100, "Current stage is too long")
    .optional()
    .default(""),

  plantedAt: z.string().datetime().optional(),

  expectedHarvestAt: z.string().datetime().optional(),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .default(""),

  estimatedYield: z
    .number()
    .positive("Estimated yield must be a positive number")
    .optional(),

  yieldUnit: z
    .string()
    .max(50, "Yield unit is too long")
    .optional()
    .default("kg"),
});

export type CropFormData = z.infer<typeof cropFormSchema>;
