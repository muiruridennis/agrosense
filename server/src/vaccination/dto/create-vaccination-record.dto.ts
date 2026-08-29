import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { VaccinationRoute } from '../enums/vaccination-route.enum';

export class CreateVaccinationRecordDto {
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  vaccineName: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  targetDisease?: string;

  @IsDateString()
  vaccinationDate: string;

  /** Free text — "0.5ml", "2 drops", "1 tablet". Matches entity storage exactly now. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dose?: string;

  @IsEnum(VaccinationRoute)
  route: VaccinationRoute;

  @IsInt()
  @Min(1)
  birdsVaccinated: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  administeredBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
