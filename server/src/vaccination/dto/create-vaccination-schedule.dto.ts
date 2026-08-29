import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class CreateVaccinationScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  vaccineName: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  targetDisease?: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  recommendedAgeWeeks?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  targetBirds?: number;

  @IsOptional()
  @IsNumber()
  vaccinatedBirds?: number;
}
