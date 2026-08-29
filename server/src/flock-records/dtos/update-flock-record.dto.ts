import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { EggCollectionDto } from './egg-collection.dto';
import { GrowthRecordDto } from './growth-record.dto';

export class UpdateFlockRecordDto {
  @IsDateString()
  @IsOptional()
  recordDate?: string;

  // ─── POPULATION ───────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  mortalityCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  cullingCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cullingReason?: string;

  // ─── FEED ─────────────────────────────────────────────────────────────

  @IsNumber()
  @Min(0)
  @IsOptional()
  feedConsumedKg?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  feedType?: string;

  // ─── WATER ────────────────────────────────────────────────────────────

  @IsNumber()
  @Min(0)
  @IsOptional()
  waterConsumedLitres?: number;

  // ─── EGGS (layers / kienyeji) ────────────────────────────────────────

  @ValidateNested()
  @Type(() => EggCollectionDto)
  @IsOptional()
  eggCollection?: EggCollectionDto;

  // ─── GROWTH / WEIGHT (layers / broilers / kienyeji) ───────────────────

  @ValidateNested()
  @Type(() => GrowthRecordDto)
  @IsOptional()
  growthRecord?: GrowthRecordDto;

  // ─── HEALTH ───────────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  sickCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  healthNotes?: string;

  // ─── ENVIRONMENT ───────────────────────────────────────────────────────

  @IsNumber()
  @Min(-10)
  @Max(50)
  @IsOptional()
  houseTemperatureCelsius?: number;

  // ─── NOTES ─────────────────────────────────────────────────────────────

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
