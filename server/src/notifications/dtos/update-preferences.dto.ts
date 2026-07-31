import { IsOptional, IsObject, IsBoolean, IsNotEmpty } from 'class-validator';

import { Type } from 'class-transformer';
export class UpdateQuietHoursDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /**
   * Example: 22:00
   */
  @IsOptional()
  @IsNotEmpty()
  start?: string;

  /**
   * Example: 08:00
   */
  @IsOptional()
  @IsNotEmpty()
  end?: string;

  @IsOptional()
  days?: string[];

  /**
   * Critical alerts bypass quiet hours
   */
  @IsOptional()
  @IsBoolean()
  overrideForCritical?: boolean;
}


export class UpdatePreferencesDto {
  /**
   * Enabled channels
   *
   * Example:
   * {
   *   sms:true,
   *   email:false
   * }
   */
  @IsOptional()
  @IsObject()
  channels?: Record<string, boolean>;

  /**
   * Quiet hours configuration
   */
  @IsOptional()
  @Type(() => UpdateQuietHoursDto)
  quietHours?: UpdateQuietHoursDto;

  /**
   * Notification categories
   */
  @IsOptional()
  @IsObject()
  categories?: Record<string, any>;

  /**
   * Default notification frequency
   */
  @IsOptional()
  defaultFrequency?: 'instant' | 'daily' | 'weekly';
}

