import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { VaccinationRoute } from '../enums/vaccination-route.enum';

export class UpdateVaccinationRecordDto {
  @IsOptional()
  @IsString()
  scheduleId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  vaccineName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  targetDisease?: string | null;

  @IsOptional()
  @IsDateString()
  vaccinationDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  dose?: string;

  @IsOptional()
  @IsEnum(VaccinationRoute)
  route?: VaccinationRoute;

  @IsOptional()
  @IsInt()
  @Min(1)
  birdsVaccinated?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string | null;

  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  administeredBy?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
