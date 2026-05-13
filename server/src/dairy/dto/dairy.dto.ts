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
import { CowType, CowStatus } from '../entities/cow.entity';
import { ServiceType, BreedingStatus } from '../entities/breeding-record.entity';
import { HealthCondition } from '../../health-event/enums/health-condition.enum';

// ── COW MANAGEMENT ─────────────────────────────────────────────────────────

export class CreateCowDto {
  @IsString() @IsOptional() @MaxLength(50)
  tagId?: string; // e.g. "K001"

  @IsString() @IsOptional() @MaxLength(100)
  name?: string; // e.g. "Molly"

  @IsEnum(CowType)
  type!: CowType; // dairy, beef, dual_purpose

  @IsString() @IsNotEmpty() @MaxLength(100)
  breed!: string; // e.g. "Friesian"

  @IsDateString()
  dateOfBirth!: string; // ISO date

  @IsDateString()
  dateAcquired!: string; // ISO date

  @IsNumber() @IsOptional() @Min(0)
  currentWeightKg?: number;

  @IsString() @IsOptional()
  notes?: string;
}

export class UpdateCowDto extends PartialType(CreateCowDto) {
  @IsEnum(CowStatus) @IsOptional()
  status?: CowStatus;

  @IsDateString() @IsOptional()
  dateLeft?: string;
}

export class CowSummaryDto {
  // From Cow entity
  id!: string;
  tagId!: string | null;
  name!: string | null;
  type!: CowType;
  breed!: string;
  dateOfBirth!: Date;
  dateAcquired!: Date;
  status!: CowStatus;
  currentWeightKg!: number | null;

  // Computed live state
  ageMonths?: number;
  lactationNumber?: number | null;
  isCurrentlyLactating?: boolean;
  daysInMilk?: number | null;
  expectedNextHeatDate?: Date | null;

  // Related summaries
  currentLactation?: {
    id: string;
    freshenDate: Date;
    lactationNumber: number;
    daysActive: number;
  } | null;

  currentBreeding?: {
    id: string;
    serviceDate: Date;
    status: BreedingStatus;
    expectedBirthDate: Date | null;
  } | null;

  recentHealthEvents?: Array<{
    id: string;
    condition: HealthCondition;
    occurredDate: Date;
    resolved: boolean;
  }>;

  last7DayYield?: number; // litres
  avgYield?: number;       // litres per day (all time)
}

// ── LACTATION RECORDS ──────────────────────────────────────────────────────

export class CreateLactationRecordDto {
  @IsDateString()
  recordDate!: string; // ISO date

  @IsNumber() @Min(0)
  yieldLitres!: number;

  @IsNumber() @IsOptional() @Min(0) @Max(6)
  butterfatPercent?: number; // typical 3.5–4.5%

  @IsNumber() @IsOptional() @Min(0) @Max(4)
  proteinPercent?: number; // typical 3.0–3.5%

  @IsInt() @IsOptional() @Min(0)
  somaticCellCount?: number; // cells per mL

  @IsString() @IsOptional()
  remarks?: string;
}

export class UpdateLactationRecordDto extends PartialType(CreateLactationRecordDto) {}

export class SubmitLactationRecordDto {
  // No fields — just a marker action (PATCH .../submit)
}

export class ReviewLactationRecordDto {
  @IsEnum(['reviewed', 'flagged'])
  status!: 'reviewed' | 'flagged';

  @IsString() @IsOptional()
  reviewNote?: string; // required if status = flagged
}

// ── BREEDING RECORDS ───────────────────────────────────────────────────────

export class CreateBreedingRecordDto {
  @IsDateString()
  serviceDate!: string; // ISO date

  @IsString() @IsOptional()
  bullId?: string; // e.g. "AI123" or bull tag "B-045"

  @IsEnum(ServiceType)
  serviceType!: ServiceType; // ai or natural

  @IsString() @IsOptional()
  notes?: string;
}

export class UpdateBreedingRecordDto extends PartialType(CreateBreedingRecordDto) {}

export class ConfirmPregnancyDto {
  @IsDateString()
  pregnancyConfirmedDate!: string; // date palpation/scan was done
}

// ── HEALTH EVENTS ──────────────────────────────────────────────────────────

export class CreateHealthEventDto {
  @IsDateString()
  occurredDate!: string; // ISO date (when problem was observed)

  @IsEnum(HealthCondition)
  condition!: HealthCondition;

  @IsString() @IsNotEmpty()
  description!: string; // what the farmer observed

  @IsString() @IsOptional()
  treatment?: string; // what was done

  @IsString() @IsOptional()
  notes?: string;
}

export class UpdateHealthEventDto extends PartialType(CreateHealthEventDto) {}

export class ResolveHealthEventDto {
  @IsDateString()
  resolvedDate!: string; // ISO date (when issue healed)

  @IsString() @IsOptional()
  notes?: string; // e.g. "Recovery took 7 days"
}

// ── DAIRY FARM SUMMARY ─────────────────────────────────────────────────────

export class DairyFarmSummaryDto {
  // Herd composition
  totalCows!: number;
  activeCows!: number;
  soldThisYear!: number;
  deceasedThisYear!: number;

  // Current production
  cowsInMilk!: number;
  avgYieldPerCow!: number; // litres per day
  totalYesterdayLitres!: number;

  // Breeding pipeline
  cowsPregnant!: number;
  expectedBirthsThisMonth!: number;
  expectedBirthsNextMonth!: number;
  cowsReadyToBreed!: number; // (days from heat)

  // Health
  healthAlertsToday!: HealthCondition[];
  activeMastitusCases!: number;
  activeLamenessCases!: number;

  // Lactation performance
  highestProducers!: Array<{
    cowTagId: string;
    yieldLitres: number;
    daysInMilk: number;
  }>;

  lowestProducers!: Array<{
    cowTagId: string;
    yieldLitres: number;
    daysInMilk: number;
  }>;
}

export class LactationTrendDto {
  // 7-day or 30-day trend for a single cow
  cowTagId!: string;
  period!: 'week' | 'month'; // '7 days' or '30 days'
  avgYield!: number;
  minYield!: number;
  maxYield!: number;
  trend!: 'improving' | 'stable' | 'declining'; // slope of yield over time
  avgButterFat!: number;
  avgProtein!: number;
  avgSCC!: number;
}

export class BreedingCalendarDto {
  // For farm-wide breeding management
  dueToBreedSoon!: Array<{
    cowTagId: string;
    daysUntilHeat: number;
    lastServiceDate: Date;
    lastStatus: BreedingStatus;
  }>;

  dueToBirth!: Array<{
    cowTagId: string;
    daysUntilBirth: number;
    expectedBirthDate: Date;
    currentLactationNumber: number;
  }>;

  pregnancyChecksPending!: Array<{
    cowTagId: string;
    serviceDate: Date;
    daysPostService: number;
  }>;
}