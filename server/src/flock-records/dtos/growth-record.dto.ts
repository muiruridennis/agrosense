import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * A farmer weighing broilers doesn't compute an average themselves — they
 * weigh a sample of birds together on a scale and know the total and how
 * many birds were on it. Same real-world pattern as trays+loose for eggs.
 *
 * Supply EITHER `averageWeightKg` directly OR `totalSampleWeightKg` +
 * `sampleSize` — never both. See resolveAverageWeightKg() in
 * growth-weight.util.ts for the single place this gets resolved.
 */
export class GrowthRecordDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  averageWeightKg?: number;

  /** Combined weight of every sampled bird, before dividing */
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalSampleWeightKg?: number;

  /** Required when totalSampleWeightKg is given — how many birds were weighed */
  @IsInt()
  @Min(1)
  @IsOptional()
  sampleSize?: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
