import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

import { AnimalType } from '../entities/health-event.entity';
import { TreatmentRoute } from '../enums/treatment-route.enum';

/**
 * CreateVaccinationDto
 *
 * Frontend sends date strings
 * DTO validates string format
 * class-transformer converts to Date
 *
 * Goal:
 * - API-safe
 * - TypeORM-compatible
 * - Inventory-linkable
 * - Booster-chain capable
 */
export class CreateVaccinationDto {
  // ─────────────────────────────────────────────────────────────
  // FARM & ANIMAL
  // ─────────────────────────────────────────────────────────────

  @IsUUID()
  farmId!: string;

  @IsEnum(AnimalType)
  animalType!: AnimalType;

  @IsUUID()
  animalId!: string;

  // ─────────────────────────────────────────────────────────────
  // VACCINE DETAILS
  // ─────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  vaccineName!: string;

  @IsUUID()
  @IsOptional()
  inventoryItemId?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  // ─────────────────────────────────────────────────────────────
  // ADMINISTRATION
  // ─────────────────────────────────────────────────────────────

  @Type(() => Date)
  @IsDateString()
  administeredDate!: Date;

  @IsEnum(TreatmentRoute)
  route!: TreatmentRoute;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dosage?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsUUID()
  @IsOptional()
  administeredBy?: string;

  // ─────────────────────────────────────────────────────────────
  // IMMUNITY / BOOSTER TRACKING
  // ─────────────────────────────────────────────────────────────

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  nextBoosterDue?: Date;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  immunityExpiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  isBooster?: boolean;

  @IsUUID()
  @IsOptional()
  parentVaccinationId?: string;

  // ─────────────────────────────────────────────────────────────
  // CLINICAL NOTES
  // ─────────────────────────────────────────────────────────────

  @IsString()
  @IsOptional()
  reaction?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}