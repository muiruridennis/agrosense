import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  AnimalType,
  HealthEventSeverity,
  HealthEventStatus,
} from '../entities/health-event.entity';

// ── CREATE ─────────────────────────────────────────────────────────────────

/**
 * CreateHealthEventDto - recorded by farm workers or managers
 * Works for any animal type (cow, ruminant, poultry)
 */
export class CreateHealthEventDto {
  @IsEnum(AnimalType)
  @IsNotEmpty()
  animalType!: AnimalType; // 'cow' | 'ruminant' | 'poultry'

  @IsUUID()
  @IsNotEmpty()
  animalId!: string; // UUID of specific animal

  @IsString()
  @IsOptional()
  @MaxLength(100)
  animalTag?: string; // e.g. "K001", "G045" (for display)

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  condition!: string; // e.g. "mastitis", "parasites", "lameness"

  @IsString()
  @IsNotEmpty()
  description!: string; // detailed description of what happened

  @IsEnum(HealthEventSeverity)
  @IsOptional()
  severity?: HealthEventSeverity; // defaults to MEDIUM

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[]; // e.g. ["swollen udder", "cloudy milk"]

  @IsString()
  @IsOptional()
  @MaxLength(255)
  diagnosis?: string; // diagnosis if known

  @IsString()
  @IsOptional()
  @MaxLength(255)
  treatment?: string; // treatment applied

  @IsNumber()
  @IsOptional()
  @Min(35)
  @Max(42)
  temperatureCelsius?: number; // body temperature

  @IsNumber()
  @IsOptional()
  @Min(0)
  weightKg?: number; // weight at time of event

  @IsDateString()
  @IsOptional()
  occurredDate?: string; // ISO date, defaults to today

  @IsNumber()
  @IsOptional()
  @Min(0)
  treatmentCost?: number; // cost of treatment

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string; // KES, USD, etc (defaults to KES)

  @IsString()
  @IsOptional()
  @MaxLength(100)
  treatedBy?: string; // name of vet or handler

  @IsString()
  @IsOptional()
  notes?: string; // additional notes
}

// ── UPDATE ─────────────────────────────────────────────────────────────────

/**
 * UpdateHealthEventDto - partial update of existing health event
 */
export class UpdateHealthEventDto extends PartialType(CreateHealthEventDto) {}

// ── STATUS UPDATES ─────────────────────────────────────────────────────────

/**
 * UpdateHealthEventStatusDto - change status (reported → under_treatment → resolved)
 */
export class UpdateHealthEventStatusDto {
  @IsEnum(HealthEventStatus)
  @IsNotEmpty()
  status!: HealthEventStatus;

  @IsDateString()
  @IsOptional()
  resolvedDate?: string; // when animal recovered

  @IsString()
  @IsOptional()
  notes?: string; // final notes on resolution
}

/**
 * MarkAsResolvedDto - convenient DTO to mark event as resolved
 */
export class MarkAsResolvedDto {
  @IsDateString()
  @IsOptional()
  resolvedDate?: string; // defaults to today

  @IsString()
  @IsOptional()
  notes?: string; // recovery notes
}

/**
 * MarkAsFatalDto - record animal death
 */
export class MarkAsFatalDto {
  @IsDateString()
  @IsOptional()
  deathDate?: string; // defaults to occurredDate

  @IsString()
  @IsOptional()
  causeOfDeath?: string; // cause if known

  @IsNumber()
  @IsOptional()
  @Min(0)
  animalValue?: number; // estimated value for financial impact

  @IsString()
  @IsOptional()
  notes?: string;
}

// ── RESPONSE DTOS ──────────────────────────────────────────────────────────

/**
 * HealthEventResponseDto - return from API
 * Includes computed fields and helper info
 */
export class HealthEventResponseDto {
  id!: string;
  farmId!: string;
  animalType!: AnimalType;
  animalId!: string;
  animalTag!: string | null;

  // Classification
  condition!: string;
  severity!: HealthEventSeverity;
  status!: HealthEventStatus;
  isActive!: boolean;

  // Clinical details
  symptoms!: string[] | null;
  description!: string;
  diagnosis!: string | null;
  treatment!: string | null;

  // Measurements
  temperatureCelsius!: number | null;
  weightKg!: number | null;

  // Timeline
  occurredDate!: Date;
  resolvedDate!: Date | null;
  durationDays?: number | null; // computed

  // Financial
  treatmentCost!: number | null;
  currency!: string | null;
  productivityLossDays!: number | null;
  totalImpact?: number; // computed

  // Metadata
  treatedBy!: string | null;
  notes!: string | null;

  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * HealthEventListDto - lightweight response for lists
 */
export class HealthEventListDto {
  id!: string;
  animalType!: AnimalType;
  animalTag!: string | null;
  condition!: string;
  severity!: HealthEventSeverity;
  status!: HealthEventStatus;
  isActive!: boolean;
  occurredDate!: Date;
  resolvedDate!: Date | null;
}

// ── DASHBOARD DTOS ────────────────────────────────────────────────────────

/**
 * FarmHealthSummaryDto - overview of farm health
 * Shows: total issues, by severity, by animal type, by condition
 */
export class FarmHealthSummaryDto {
  farmId!: string;

  // Overall stats
  totalActive!: number;
  totalResolved!: number;
  totalFatal!: number;

  // By severity
  bySeverity!: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // By animal type
  byAnimalType!: {
    cow: number;
    ruminant: number;
    poultry: number;
  };

  // By condition (top issues)
  byCondition!: Record<string, number>;

  // Critical issues needing immediate attention
  critical!: HealthEventListDto[];

  // Most recent events
  recentEvents!: HealthEventListDto[];
}

/**
 * AnimalHealthSummaryDto - health summary for single animal
 */
export class AnimalHealthSummaryDto {
  animalId!: string;
  animalTag!: string | null;
  animalType!: AnimalType;

  // Health status
  totalHealthEvents!: number;
  activeIssues!: number;
  resolvedIssues!: number;
  fatalIssues!: number;

  // Recent activity
  lastHealthEventDate?: Date;
  lastHealthEventCondition?: string;

  // Most common issues
  commonConditions!: Array<{
    condition: string;
    count: number;
    lastOccurred: Date;
  }>;

  // Active issues

  // Health score (0-100)
  healthScore!: number; // 100 = no issues, decreases with active issues
}

/**
 * HealthEventTrendDto - analyze health trends over time
 */
export class HealthEventTrendDto {
  farmId!: string;
  period!: {
    startDate: Date;
    endDate: Date;
    days: number;
  };

  // Trend metrics
  totalEvents!: number;
  avgEventsPerDay!: number;
  severityTrend!: string; // "improving" | "stable" | "worsening"

  // By severity
  eventsBySeverity!: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // By animal type
  eventsByAnimalType!: {
    cow: number;
    ruminant: number;
    poultry: number;
  };

  // Most common conditions (top 5)
  mostCommonConditions!: Array<{
    condition: string;
    count: number;
    avgDurationDays: number;
  }>;

  // Mortality rate
  fatalEventsCount!: number;
  mortalityRate!: number; // percentage

  // Recovery metrics
  averageResolutionDays?: number;
  criticalIssuesResolutionRate?: number; // % of critical issues resolved
}

/**
 * HealthEventFinancialImpactDto - financial impact analysis
 */
export class HealthEventFinancialImpactDto {
  farmId!: string;
  period!: {
    startDate: Date;
    endDate: Date;
    days: number;
  };

  // Direct costs
  totalTreatmentCosts!: number; // vet, medicine, etc
  currency!: string; // KES

  // Indirect costs
  totalProductivityLoss!: number; // estimated from days missed
  totalAnimalLoss!: number; // estimated value of deaths

  // Summary
  totalImpact!: number; // sum of all costs
  avgCostPerEvent!: number;
  costPerDay!: number;

  // By animal type
  costByAnimalType!: {
    cow: number;
    ruminant: number;
    poultry: number;
  };

  // By condition
  costByCondition!: Record<string, number>;

  // Efficiency metrics
  costPerTreatedAnimal?: number;
  survivalCostRatio?: number; // cost to save animal / animal value
}

/**
 * HealthEventBreedingImpactDto - impact of health on breeding
 * (for dairy & ruminants modules)
 */
export class HealthEventBreedingImpactDto {
  farmId!: string;
  animalType!: AnimalType; // cow | ruminant

  // Affected animals
  animalsWithHealthIssues!: number;
  affectedBreedingAnimals!: number; // specifically breeding-age animals

  // Impact on breeding cycle
  delayedConceptions!: number; // animals delayed in breeding
  missedBreedingOpportunities!: number;
  estimatedProductionLoss!: string; // e.g. "2 calves delayed" or "4 liters/day"

  // Timeline impact
  averageBreedingDelayDays!: number;

  // Recovery time needed
  estimatedRecoveryDays!: number;
}

// ── QUERY DTOS ─────────────────────────────────────────────────────────────

/**
 * HealthEventFilterDto - for querying/filtering health events
 */
export class HealthEventFilterDto {
  @IsEnum(AnimalType)
  @IsOptional()
  animalType?: AnimalType;

  @IsUUID()
  @IsOptional()
  animalId?: string;

  @IsEnum(HealthEventSeverity)
  @IsOptional()
  severity?: HealthEventSeverity;

  @IsEnum(HealthEventStatus)
  @IsOptional()
  status?: HealthEventStatus;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean; // default: true for most queries

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * PaginatedHealthEventResponseDto - paginated list response
 */
export class PaginatedHealthEventResponseDto {
  data!: HealthEventResponseDto[];
  pagination!: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ── BULK OPERATIONS ────────────────────────────────────────────────────────

/**
 * BulkResolveHealthEventsDto - resolve multiple events at once
 */
export class BulkResolveHealthEventsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  eventIds!: string[];

  @IsDateString()
  @IsOptional()
  resolvedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * BulkHealthEventResponseDto - response from bulk operations
 */
export class BulkHealthEventResponseDto {
  successful!: number;
  failed!: number;
  errors?: Array<{
    eventId: string;
    error: string;
  }>;
}

// ── EXPORT ─────────────────────────────────────────────────────────────────

export const HEALTH_EVENT_DTOS = {
  // Create/Update
  CreateHealthEventDto,
  UpdateHealthEventDto,
  UpdateHealthEventStatusDto,
  MarkAsResolvedDto,
  MarkAsFatalDto,

  // Response
  HealthEventResponseDto,
  HealthEventListDto,
  PaginatedHealthEventResponseDto,

  // Dashboard
  FarmHealthSummaryDto,
  AnimalHealthSummaryDto,
  HealthEventTrendDto,
  HealthEventFinancialImpactDto,
  HealthEventBreedingImpactDto,

  // Query
  HealthEventFilterDto,
  BulkResolveHealthEventsDto,
  BulkHealthEventResponseDto,
};