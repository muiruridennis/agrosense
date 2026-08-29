import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export enum NotificationFrequency {
  INSTANT = 'instant',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export class UpdateCategoryDto {
  /**
   * Enable/disable category
   */
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean;

  /**
   * How often notifications are sent
   */
  @IsOptional()
  @IsEnum(NotificationFrequency)
  frequency?: NotificationFrequency;

  /**
   * Priority
   */
  @IsOptional()
  @IsString()
  priority?: 'low' | 'normal' | 'high' | 'critical';
}
