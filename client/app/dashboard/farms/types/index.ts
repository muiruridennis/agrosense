import { z } from "zod";

export const farmSchema = z.object({
  name: z
    .string()
    .min(2, "Farm name must be at least 2 characters")
    .max(100, "Farm name must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  areaHectares: z
    .number()
    .positive("Area must be greater than 0")
    .max(100_000, "Area seems too large"),
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "County / region is required"),
  subRegion: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  location: z
    .object({
      latitude: z
        .number()
        .min(-90)
        .max(90),
      longitude: z
        .number()
        .min(-180)
        .max(180),
    })
    .optional(),
});

export type FarmFormData = z.infer<typeof farmSchema>;;

export interface CreateFarmInput extends FarmFormData {}
export interface UpdateFarmInput extends Partial<FarmFormData> {}