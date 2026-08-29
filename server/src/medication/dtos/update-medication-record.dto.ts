import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicationRecordDto } from './create-medication-record.dto';

/**
 * status is deliberately excluded — transitions go through
 * CompleteMedicationDto/CancelMedicationDto below, not a general PATCH.
 * Same reasoning as UpdatePoultryHouseDto excluding `status`: a status
 * change has different rules (required reason on cancel, locks the record)
 * than an ordinary field edit.
 */
export class UpdateMedicationRecordDto extends PartialType(
  CreateMedicationRecordDto,
) {}

export class CompleteMedicationDto {
  /** The real last day of administration. Defaults to today if omitted. */
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CancelMedicationDto {
  /** The real last day dosing actually occurred before stopping. Defaults to today if omitted. */
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
