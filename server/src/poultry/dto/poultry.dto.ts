import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { HouseType } from '../entities/poultry-house.entity';
import { FlockType } from '../entities/flock.entity';

// ── PoultryHouse DTOs ─────────────────────────────────────────────────────────

export class CreatePoultryHouseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(HouseType)
  houseType!: HouseType;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePoultryHouseDto extends PartialType(CreatePoultryHouseDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ── Flock DTOs ────────────────────────────────────────────────────────────────

export class CreateFlockDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  breed!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(FlockType)
  type!: FlockType;

  @IsInt()
  @Min(1)
  initialCount!: number;

  @IsDateString()
  placementDate!: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  ageAtPlacementWeeks?: number;

  // Broilers
  @IsNumber()
  @IsOptional()
  targetWeightKg?: number;

  @IsInt()
  @IsOptional()
  targetDays?: number;

  // Layers
  @IsInt()
  @IsOptional()
  productionStartWeek?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFlockDto extends PartialType(CreateFlockDto) {}

// ── FlockRecord DTOs ──────────────────────────────────────────────────────────

/**
 * Create daily flock record — the operational heart of the system
 * Workers submit daily observations; system auto-calculates KPIs
 */
export class CreateFlockRecordDto {
  @IsDateString()
  recordDate!: string;

  // ── MORTALITY & LOSSES ────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  mortality?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  culls?: number;

  // ── FEED & WATER ──────────────────────────────────────────────────────────

  @IsNumber()
  @Min(0)
  feedConsumedKg!: number;

  @IsString()
  @IsOptional()
  feedType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  waterConsumedLitres?: number;

  // ── HEALTH ────────────────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  sickBirds?: number;

  @IsString()
  @IsOptional()
  medication?: string;

  @IsNumber()
  @IsOptional()
  temperatureCelsius?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  // ── LAYERS-SPECIFIC ───────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  morningEggs?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  eveningEggs?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  brokenEggs?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  dirtyEggs?: number;

  // ── BROILERS-SPECIFIC ─────────────────────────────────────────────────────

  @IsNumber()
  @Min(0)
  @IsOptional()
  avgBodyWeightKg?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  sampleSize?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  uniformityPercent?: number;

  @IsUUID()
  @IsOptional()
  feedItemId?: string;
}

export class UpdateFlockRecordDto extends PartialType(CreateFlockRecordDto) {}

export class ReviewFlockRecordDto {
  @IsEnum(['reviewed', 'flagged'])
  status!: 'reviewed' | 'flagged';

  /** Required when flagging */
  @IsString()
  @IsOptional()
  reviewNote?: string;
}
export class RecordBirdSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  buyer!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  pricePerBird!: number;

  @IsDateString()
  saleDate!: string;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsEnum(['pending', 'paid', 'partial'])
  @IsOptional()
  paymentStatus?: 'pending' | 'paid' | 'partial';

  @IsString()
  @IsOptional()
  notes?: string;
}
