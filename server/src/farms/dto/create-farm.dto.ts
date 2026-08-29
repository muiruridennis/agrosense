import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// ─────────────────────────────────────────────────────────────────────────────
// GEOLOCATION
// ─────────────────────────────────────────────────────────────────────────────

export class GeoPointDto {
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;
}

class GeoPolygonDto {
  @IsArray()
  @IsArray({ each: true })
  coordinates!: number[][][];
}

// ─────────────────────────────────────────────────────────────────────────────
// FARM
// ─────────────────────────────────────────────────────────────────────────────

export class CreateFarmDto {
  // ── Identity ───────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // ── Physical information ──────────────────────────────────────────────────

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaHectares?: number;

  // ── Location ──────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subRegion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPolygonDto)
  boundary?: GeoPolygonDto;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateFarmDto extends PartialType(CreateFarmDto) {}