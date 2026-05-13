import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CropCycleStatus, CropStage } from '../entities/crop-cycle.entity';

export class CreateCropCycleDto {
  @IsString()
  @IsNotEmpty()
  cropType!: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsDateString()
  plantedAt!: string;

  @IsOptional()
  @IsDateString()
  expectedHarvestAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedYieldKg?: number;

  @IsOptional()
  @IsEnum(CropStage)
  currentStage?: CropStage;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateCropCycleDto {
  @IsOptional()
  @IsEnum(CropStage)
  currentStage?: CropStage;

  @IsOptional()
  @IsEnum(CropCycleStatus)
  status?: CropCycleStatus;

  @IsOptional()
  @IsDateString()
  actualHarvestAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yieldKg?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}