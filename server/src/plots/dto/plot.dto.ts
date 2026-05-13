import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  
} from 'class-validator';
import { SoilType } from '../entities/plot.entity';

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