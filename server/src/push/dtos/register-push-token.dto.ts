import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsIn(['ios', 'android', 'web'])
  deviceType: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}