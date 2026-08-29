import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { MedicationRoute } from '../enums/medication-route.enum';

export class CreateMedicationRecordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicationName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose!: string;

  @IsDateString()
  startDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  dosage!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  frequency!: string;

  @IsEnum(MedicationRoute)
  route!: MedicationRoute;

  /** Informational only — see MedicationRecord entity comment. Not used for withdrawal scope. */
  @IsInt()
  @Min(1)
  @IsOptional()
  affectedBirds?: number;

  /** Required — 0 is valid (no withdrawal needed), but must be an explicit decision */
  @IsInt()
  @Min(0)
  @Max(365)
  withdrawalPeriodDays!: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
