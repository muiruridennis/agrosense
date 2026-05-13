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
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  RuminantSpecies,
  RuminantSex,
  RuminantStatus,
  RuminantPurpose,
} from '../entities/ruminant.entity';
import { HealthCondition } from '../../health-event/enums/health-condition.enum';

// ── RUMINANT MANAGEMENT ────────────────────────────────────────────────────

export class CreateRuminantDto {
  @IsEnum(RuminantSpecies)
  species!: RuminantSpecies; // goat or sheep

  @IsString() @IsOptional() @MaxLength(50)
  tagId?: string; // e.g. "G001"

  @IsString() @IsOptional() @MaxLength(100)
  name?: string; // e.g. "Nandi"

  @IsString() @IsNotEmpty() @MaxLength(100)
  breed!: string; // e.g. "Alpine", "Boer"

  @IsEnum(RuminantSex)
  sex!: RuminantSex; // male, female, unknown

  @IsEnum(RuminantPurpose)
  purpose!: RuminantPurpose; // meat, breeding, dairy, dual

  @IsDateString()
  dateOfBirth!: string; // ISO date

  @IsDateString()
  dateAcquired!: string; // ISO date

  @IsNumber() @IsOptional() @Min(0)
  currentWeightKg?: number;

  @IsNumber() @IsOptional() @Min(0)
  targetWeightKg?: number; // for meat animals

  @IsString() @IsOptional()
  notes?: string;
}

export class UpdateRuminantDto extends PartialType(CreateRuminantDto) {
  @IsEnum(RuminantStatus) @IsOptional()
  status?: RuminantStatus;

  @IsDateString() @IsOptional()
  dateLeft?: string;

  @IsBoolean() @IsOptional()
  isBreedable?: boolean;
}

export class RuminantSummaryDto {
  id!: string;
  tagId!: string | null;
  name!: string | null;
  species!: RuminantSpecies;
  breed!: string;
  sex!: RuminantSex;
  purpose!: RuminantPurpose;
  dateOfBirth!: Date;
  status!: RuminantStatus;
  currentWeightKg!: number | null;
  targetWeightKg!: number | null;

  // Computed live state
  ageWeeks?: number;
  ageMonths?: number;
  expectedMarketDate?: Date | null;
  daysToMarket?: number | null;
  growthRateKgPerWeek?: number;

  // Related data
  latestWeight?: number;
  latestWeightDate?: Date | null;
  totalWeightGain?: number;

  isPregnant?: boolean;
  expectedBirthDate?: Date | null;

  recentHealthEvents?: Array<{
    id: string;
    condition: HealthCondition;
    occurredDate: Date;
    resolved: boolean;
  }>;
}

// ── GROWTH RECORDS ─────────────────────────────────────────────────────────

export class CreateGrowthRecordDto {
  @IsDateString()
  recordDate!: string; // ISO date

  @IsNumber() @Min(0)
  weightKg!: number;

  @IsInt() @IsOptional() @Min(1) @Max(5)
  bodyConditionScore?: number; // 1–5

  @IsString() @IsOptional()
  remarks?: string;
}

export class UpdateGrowthRecordDto extends PartialType(CreateGrowthRecordDto) {}

export class GrowthTrendDto {
  ruminantTagId!: string;
  period!: 'week' | 'month'; // "7 days" or "30 days"
  startDate!: Date;
  endDate!: Date;

  currentWeightKg!: number;
  startWeightKg!: number;
  weightGainKg!: number;
  growthRateKgPerDay!: number;
  growthRateKgPerWeek!: number;

  avgBodyConditionScore!: number;

  estimatedMarketDate?: Date;
  daysToTarget?: number;
}

// ── BREEDING RECORDS ───────────────────────────────────────────────────────

export class CreateBreedingRecordDto {
  @IsDateString()
  serviceDate!: string; // ISO date (mating date)

  @IsString() @IsOptional()
  maleId?: string; // buck/ram tag ID or name

  @IsString() @IsOptional()
  notes?: string;
}

export class UpdateBreedingRecordDto extends PartialType(CreateBreedingRecordDto) {}

export class ConfirmBreedingPregnancyDto {
  @IsDateString()
  pregnancyConfirmedDate!: string; // palpation/scan date

  @IsInt() @IsOptional() @Min(1) @Max(5)
  expectedOffspring?: number; // if known
}

// ── HEALTH EVENTS ──────────────────────────────────────────────────────────

export class CreateHealthEventDto {
  @IsDateString()
  occurredDate!: string; // ISO date

  @IsEnum(HealthCondition)
  condition!: HealthCondition;

  @IsString() @IsNotEmpty()
  description!: string;

  @IsString() @IsOptional()
  treatment?: string;

  @IsString() @IsOptional()
  notes?: string;
}

export class UpdateHealthEventDto extends PartialType(CreateHealthEventDto) {}

export class ResolveHealthEventDto {
  @IsDateString()
  resolvedDate!: string; // ISO date

  @IsString() @IsOptional()
  notes?: string;
}

// ── FARM SUMMARIES ─────────────────────────────────────────────────────────

export class RuminantFarmSummaryDto {
  // Herd composition
  totalRuminants!: number;
  activeRuminants!: number;
  goats!: number;
  sheep!: number;

  // By purpose
  meatAnimals!: number;
  breedingAnimals!: number;
  dairyAnimals!: number;

  // Current status
  readyForMarket!: number; // within 30 days
  daysAwayFromMarket!: number[]; // distribution of time to market

  avgWeightKg!: number;
  avgBodyConditionScore!: number;

  // Breeding status
  animalsPregnant!: number;
  expectedBirthsThisMonth!: number;
  expectedBirthsNextMonth!: number;

  // Health
  activeHealthIssues!: number;
  healthIssuesByCondition!: Record<HealthCondition, number>;

  // Market value
  estimatedMarketValue?: number; // if price per kg known

  // Top performers
  fastestGrowing!: Array<{
    ruminantTagId: string;
    growthRateKgPerWeek: number;
    currentWeightKg: number;
  }>;

  slowestGrowing!: Array<{
    ruminantTagId: string;
    growthRateKgPerWeek: number;
    currentWeightKg: number;
  }>;
}

export class RuminantBreedingCalendarDto {
  matingsDueThisMonth!: Array<{
    ruminantTagId: string;
    daysUntilHeat: number;
    lastBreedingDate?: Date;
  }>;

  birthsDueThisMonth!: Array<{
    ruminantTagId: string;
    daysUntilBirth: number;
    expectedBirthDate: Date;
    expectedOffspring?: number;
  }>;

  birthsDueNextMonth!: Array<{
    ruminantTagId: string;
    daysUntilBirth: number;
    expectedBirthDate: Date;
  }>;

  pregnancyChecksPending!: Array<{
    ruminantTagId: string;
    serviceDate: Date;
    daysSinceService: number;
    daysUntilCheckDue: number; // typically at day 35
  }>;
}