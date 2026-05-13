import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordCategory, RecordType } from '../entities/farm-record.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateRecordDto {
  @IsEnum(RecordType)
  recordType!: RecordType;

  @IsEnum(RecordCategory)
  category!: RecordCategory;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsDateString()
  recordedAt!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  cropCycleId?: string;

  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  clientId?: string; // offline idempotency key
}

export class UpdateRecordDto {
  @IsOptional()
  @IsEnum(RecordCategory)
  category?: RecordCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class RecordsFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;

  @IsOptional()
  @IsEnum(RecordCategory)
  category?: RecordCategory;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}