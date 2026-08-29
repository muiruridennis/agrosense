import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  HouseType,
  HousingSystem,
} from '../enums';

export class CreatePoultryHouseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(HouseType)
  houseType!: HouseType;

  @IsEnum(HousingSystem)
  housingSystem!: HousingSystem;

  @IsInt()
  @Min(1)
  capacity!: number;

  /** Square metres of usable floor space — optional but enables density checks later */
  @IsNumber()
  @Min(0)
  @IsOptional()
  floorAreaSqm?: number;

  /**
   * Biosecurity downtime between flocks, in days. Leave unset to use the
   * system default (14). Raise it for a house with a history of disease.
   */
  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  minimumRestDays?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

/**
 * Status is deliberately excluded here — occupancy is system-managed by
 * FlockModule, and manual state changes (maintenance/decommissioned) go
 * through UpdateHouseStatusDto below, where they belong with a required
 * reason rather than silently slipping in through a general PATCH.
 */
export class UpdatePoultryHouseDto extends PartialType(
  CreatePoultryHouseDto,
) {}

/**
 * The only two states a farmer sets by hand. OCCUPIED is set exclusively by
 * FlockService when a flock is placed; AVAILABLE is set automatically when
 * a flock is closed (markVacated) — a farmer marking a house AVAILABLE
 * manually is only meaningful as "maintenance is done," so it's allowed
 * here too, but OCCUPIED itself never is.
 */
export enum ManualHouseStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
}

export class UpdateHouseStatusDto {
  @IsEnum(ManualHouseStatus)
  status!: ManualHouseStatus;

  /** Why — "roof leak", "disease history, extending rest period", "retired, replaced by House C" */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}