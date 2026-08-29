import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateBroilerGrowthDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  averageWeightKg?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  sampleSize?: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
