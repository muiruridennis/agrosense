import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  HealthEventSeverity,
  HealthEventStatus,
} from '../entities/health-event.entity';

/**
 * CreateFlockOutbreakDto
 *
 * Purpose:
 * Centralized outbreak-level disease event for poultry flock intelligence
 *
 * Design Goals:
 * - Flock-wide epidemiology
 * - Mortality + production economics
 * - Quarantine linkage
 * - HealthEvent integration
 * - DTO → Entity compatibility
 *
 * Frontend:
 * - Sends dates as strings
 * Backend:
 * - Validates string format
 * - Transforms to Date
 */
export class CreateFlockOutbreakDto {
  // ─────────────────────────────────────────────────────────────
  // FARM & FLOCK
  // ─────────────────────────────────────────────────────────────

  @IsUUID()
  farmId!: string;

  @IsUUID()
  flockId!: string;

  // ─────────────────────────────────────────────────────────────
  // OUTBREAK DETAILS
  // ─────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  condition!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(HealthEventSeverity)
  severity!: HealthEventSeverity;

  /**
   * Optional at creation:
   * Usually defaults to REPORTED in entity
   */
  @IsEnum(HealthEventStatus)
  @IsOptional()
  status?: HealthEventStatus;

  // ─────────────────────────────────────────────────────────────
  // FLOCK IMPACT
  // ─────────────────────────────────────────────────────────────

  @IsNumber()
  @Min(1)
  totalBirds!: number;

  @IsNumber()
  @Min(0)
  affectedCount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  mortalityCount?: number;

  /**
   * Optional manual override.
   * Usually should be auto-calculated:
   * (mortalityCount / totalBirds) * 100
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  mortalityRate?: number;

  /**
   * Egg/meat production drop percentage
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  productionDropPercent?: number;

  // ─────────────────────────────────────────────────────────────
  // TIMELINE
  // ─────────────────────────────────────────────────────────────

  @Type(() => Date)
  @IsDateString()
  startedAt!: Date;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  resolvedAt?: Date;

  // ─────────────────────────────────────────────────────────────
  // RESPONSE & CONTROL
  // ─────────────────────────────────────────────────────────────

  /**
   * Links to primary treatment if identified
   */
  @IsUUID()
  @IsOptional()
  primaryTreatmentId?: string;

  /**
   * Example:
   * ["House A", "Brooder 2", "Zone C"]
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  quarantineZones?: string[];

  // ─────────────────────────────────────────────────────────────
  // NOTES
  // ─────────────────────────────────────────────────────────────

  @IsString()
  @IsOptional()
  notes?: string;
}