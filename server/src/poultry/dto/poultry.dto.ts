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
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { HouseType } from '../entities/poultry-house.entity';
import { FlockType } from '../entities/flock.entity';

// ── Constants ──────────────────────────────────────────────────────────────
// Single source of truth for the tray conversion — never hardcode "30"
// anywhere else in the codebase. Import this constant instead.
export const EGGS_PER_TRAY = 30;

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

// ── Economic assumptions — replaces hardcoded pricing constants ───────────────
// Previously: 4 KES/egg, 35 KES/kg feed, 250 KES/kg meat, 800 KES/bird mortality
// were hardcoded in two different service methods with no shared source.
// Now: set once per flock at creation, used consistently everywhere.

export class EconomicAssumptionsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  feedCostPerKg?: number;

  /** Price per TRAY of eggs (not per egg) — matches how farmers actually sell */
  @IsNumber()
  @Min(0)
  @IsOptional()
  eggPriceKesPerTray?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  broilerPricePerKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  mortalityCostPerBird?: number;

  /** Day-old chick weight in kg — used as the FCR weight-gain baseline */
  @IsNumber()
  @Min(0)
  @Max(0.2)
  @IsOptional()
  dayOldChickWeightKg?: number;
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
  @Max(100_000) // sanity ceiling — no house holds more than this
  initialCount!: number;

  @IsDateString()
  placementDate!: string;

  @IsInt()
  @Min(0)
  @Max(80) // a bird's productive life rarely exceeds ~80 weeks
  @IsOptional()
  ageAtPlacementWeeks?: number;

  // ── Broilers-specific targets ────────────────────────────────────────────
  @ValidateIf((dto) => dto.type === FlockType.BROILERS)
  @IsNumber()
  @Min(0.5)
  @Max(6) // broiler target weight realistically 0.5–6kg
  targetWeightKg?: number;

  @ValidateIf((dto) => dto.type === FlockType.BROILERS)
  @IsInt()
  @Min(21)
  @Max(120) // 3 weeks minimum, 120 days ceiling
  targetDays?: number;

  // ── Layers-specific ───────────────────────────────────────────────────────
  @ValidateIf((dto) => dto.type === FlockType.LAYERS)
  @IsInt()
  @Min(14)
  @Max(30) // layers typically start production weeks 16-22, allow some range
  productionStartWeek?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EconomicAssumptionsDto)
  economicAssumptions?: EconomicAssumptionsDto;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateFlockDto extends PartialType(CreateFlockDto) {}

// ── FlockRecord DTOs ──────────────────────────────────────────────────────────

/**
 * Create daily flock record — the operational heart of the system.
 *
 * IMPORTANT: bounds on mortality/sickBirds/morningEggs etc. are intentionally
 * loose here (just non-negative) because the DTO has no knowledge of the
 * flock's currentCount. The real "is this plausible for THIS flock" check
 * happens in the service layer (validateRecordPlausibility), which has
 * access to the flock entity. Don't move flock-size-relative bounds here.
 */
export class UniformitySampleDto {
  @IsNumber()
  @Min(0)
 
 @Max(10)
  minWeightKg!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  maxWeightKg!: number;

  @IsInt()
  @Min(1)
  @Max(10_000)
  sampleSize!: number;

  /** Individual weights, if captured — enables precise uniformity calc */
  @IsOptional()
  weights?: number[];
}
export class CreateFlockRecordDto {
  @IsDateString()
  recordDate!: string;

  // ── MORTALITY & LOSSES ────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  mortality?: number;

  /**
   * Culls are a DELIBERATE management decision (removing weak/sick birds),
   * distinct from natural mortality. Kept separate in reporting —
   * see PoultryService.getMortalityBreakdown().
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  culls?: number;

  // ── FEED & WATER ──────────────────────────────────────────────────────────

  @IsNumber()
  @Min(0)
  @Max(50_000) // sanity ceiling — kg of feed in a single day
  feedConsumedKg!: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  feedType?: string;

  @IsNumber()
  @Min(0)
  @Max(100_000)
  @IsOptional()
  waterConsumedLitres?: number;

  // ── HEALTH ────────────────────────────────────────────────────────────────

  @IsInt()
  @Min(0)
  @IsOptional()
  sickBirds?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  medication?: string;

  @IsNumber()
  @Min(-10)
  @Max(50) // realistic ambient temperature range for poultry houses
  @IsOptional()
  temperatureCelsius?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remarks?: string;

  // ── LAYERS-SPECIFIC: egg counts ──────────────────────────────────────────
  // Stored as individual egg counts (not trays) at the record level because
  // mortality/production-rate math needs per-bird precision. Tray conversion
  // happens only at the REPORTING layer (see toTrayBreakdown() below) and at
  // the SALES layer (RecordEggSaleDto), where farmers actually think in trays.

  @IsInt()
  @Min(0)
  @Max(200_000) // sanity ceiling for a single house's daily count
  @IsOptional()
  morningEggs?: number;

  @IsInt()
  @Min(0)
  @Max(200_000)
  @IsOptional()
  eveningEggs?: number;

  @IsInt()
  @Min(0)
  @Max(200_000)
  @IsOptional()
  brokenEggs?: number;

  @IsInt()
  @Min(0)
  @Max(200_000)
  @IsOptional()
  dirtyEggs?: number;

  // ── BROILERS-SPECIFIC ─────────────────────────────────────────────────────

  @IsNumber()
  @Min(0)
  @Max(10) // a single bird realistically never exceeds 10kg
  @IsOptional()
  avgBodyWeightKg?: number;

  @IsInt()
  @Min(1)
  @Max(10_000)
  @IsOptional()
  sampleSize?: number;

  /**
   * Uniformity % — requires min/max sample weights to calculate correctly.
   * See UniformitySampleDto below; this field is now DERIVED, not
   * directly submitted, to prevent storing a number nobody actually computed.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => UniformitySampleDto)
  uniformitySample?: UniformitySampleDto;

  @IsUUID()
  @IsOptional()
  feedItemId?: string;
}

/**
 * Uniformity is meaningless without knowing the spread of sample weights,
 * not just the average. Commercial broiler operations calculate uniformity
 * as the % of sampled birds within ±10% of the average weight.
 */

export class UpdateFlockRecordDto extends PartialType(CreateFlockRecordDto) {}

export class ReviewFlockRecordDto {
  @IsEnum(['reviewed', 'flagged'])
  status!: 'reviewed' | 'flagged';

  /** Required when flagging — enforced in service, not DTO (cross-field rule) */
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reviewNote?: string;
}

// ── Bird sales (broilers / kienyeji meat birds) ────────────────────────────

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
  @MaxLength(50)
  receiptNumber?: string;

  @IsEnum(['pending', 'paid', 'partial'])
  @IsOptional()
  paymentStatus?: 'pending' | 'paid' | 'partial';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// ── Egg sales (layers / kienyeji egg production) ───────────────────────────
// NEW — previously missing entirely. Egg revenue was only ever computed as
// an automatic daily KPI side-effect; there was no way to record an actual
// egg SALE transaction the way recordBirdSale exists for birds.

export class RecordEggSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  buyer!: string;

  /** Whole trays sold (1 tray = 30 eggs) — matches how farmers transact */
  @IsNumber()
  @Min(0.1)
  @Max(10_000)
  trays!: number;

  @IsNumber()
  @Min(0)
  pricePerTray!: number;

  @IsDateString()
  saleDate!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  receiptNumber?: string;

  @IsEnum(['pending', 'paid', 'partial'])
  @IsOptional()
  paymentStatus?: 'pending' | 'paid' | 'partial';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
