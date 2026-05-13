import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SoilType } from '../../plots/entities/plot.entity';

class GeoPointDto {
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;
}

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  areaHectares!: number;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsString()
  subRegion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  areaHectares?: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  subRegion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreatePlotDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0.001)
  areaHectares!: number;

  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(14)
  soilPhLevel?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePlotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  areaHectares?: number;

  @IsOptional()
  @IsEnum(SoilType)
  soilType?: SoilType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(14)
  soilPhLevel?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}