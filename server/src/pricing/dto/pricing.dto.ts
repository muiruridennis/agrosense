// pricing/dto/pricing.dto.ts

import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsUUID,
  IsInt,
} from 'class-validator';

export enum PricingHistoryEvent {
  CREATED = 'created',
  ACTIVATED = 'activated',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
  RESTORED = 'restored',
}

export class CreatePricingTierDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10000)
  feedCostPerKg!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10000)
  eggPricePerTray!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10000)
  broilerPricePerKg!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10000)
  mortalityCostPerBird!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(10)
  dayOldChickWeightKg!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  waterCostPerLitre?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  electricityCostPerUnit?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @IsString()
  @MinLength(5)
  @MaxLength(255)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class PricingHistoryQueryDto {
  @IsOptional()
  @IsUUID()
  farmId?: string;

  @IsOptional()
  @IsUUID()
  pricingTierId?: string;

  @IsOptional()
  @IsEnum(PricingHistoryEvent)
  event?: PricingHistoryEvent;

  @IsOptional()
  @IsUUID()
  actedBy?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}