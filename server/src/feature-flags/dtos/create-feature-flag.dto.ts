import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateFeatureFlagDto {
  // Enforces the 'channel.push' / 'notifications.digest_enabled' style
  // used everywhere flags are checked in code, so a typo'd key can't
  // silently create a flag nothing will ever match against.
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(\.[a-z0-9_]+)*$/, {
    message:
      'key must be lowercase, dot-separated segments (e.g. "channel.push")',
  })
  key: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Defaults to false at the entity level if omitted — new flags start off.
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedFarmIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedUserIds?: string[];
}