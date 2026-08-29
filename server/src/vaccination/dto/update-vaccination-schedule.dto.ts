// vaccination/dto/update-vaccination-schedule.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateVaccinationScheduleDto } from './create-vaccination-schedule.dto';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { VaccinationStatus } from '../enums/vaccination-status.enum';

export class UpdateVaccinationScheduleDto extends PartialType(
  CreateVaccinationScheduleDto,
) {
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  vaccineName?: string;

  @IsString()
  @IsOptional()
  targetDisease?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  recommendedAgeWeeks?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(VaccinationStatus)
  @IsOptional()
  status?: VaccinationStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  targetBirds?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  vaccinatedBirds?: number;
}