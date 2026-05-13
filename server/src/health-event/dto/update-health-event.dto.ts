import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthEventDto } from './create-health-event.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { HealthEventStatus } from '../entities/health-event.entity';

export class UpdateHealthEventDto extends PartialType(CreateHealthEventDto) {
  @IsEnum(HealthEventStatus)
  @IsOptional()
  status?: HealthEventStatus;

  @IsDateString()
  @IsOptional()
  resolvedDate?: string;
}