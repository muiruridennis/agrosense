import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ArrayMinSize,
  IsEnum,
  MinLength,
  IsObject,
  IsDate,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  NotificationChannel,
  NotificationPriority,
} from '../enums';

export class SendNotificationDto {

  /**
   * Farm related notification
   */
  @IsOptional()
  @IsUUID()
  farmId?: string;

  /**
   * Notification title
   */
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  title: string;

  /**
   * Notification message
   */
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  body: string;

  /**
   * Delivery channels
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  /**
   * Priority level
   */
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  /**
   * Notification category
   */
  @IsOptional()
  @IsString()
  category?: string;

  /**
   * Extra metadata
   */
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  /**
   * Reference object
   */
  @IsOptional()
  @IsObject()
  reference?: {
    id: string;
    type: string;
  };

  /**
   * Template
   */
  @IsOptional()
  @IsUUID()
  templateId?: string;

  /**
   * Schedule delivery
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledFor?: Date;
}
