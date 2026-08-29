// dto/flock.dto.ts

import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import {
  FlockStage,
  FlockStatus,
  FlockType,
} from '../enums';

export class CreateFlockDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsEnum(FlockType)
  type!: FlockType;

  @IsString()
  @IsNotEmpty()
  breed!: string;

  @IsInt()
  @Min(1)
  initialCount!: number;

  @IsDateString()
  placementDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageAtPlacementWeeks?: number;

  @IsOptional()
  @IsEnum(FlockStage)
  stage?: FlockStage;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFlockDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(FlockType)
  type?: FlockType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  breed?: string;

  @IsOptional()
  @IsDateString()
  placementDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageAtPlacementWeeks?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFlockStageDto {
  @IsEnum(FlockStage)
  stage!: FlockStage;
}

export class CloseFlockDto {
  @IsOptional()
  @IsString()
  reason?: string;
}