import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ── Register ──────────────────────────────────────────────────────────────────

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'fullName is required' })
  @Length(2, 100, { message: 'fullName must be between 2 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  fullName!: string;

  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phoneNumber must be in E.164 format e.g. +254712345678',
  })
  phoneNumber!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @Length(2, 10, { message: 'preferredLanguage must be a valid language code e.g. en, sw' })
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'role is required' })
  role?: string;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export class LoginDto {
  /**
   * Accepts either an email address or an E.164 phone number.
   * Examples: john@example.com | +254712345678
   */
  @IsString()
  @IsNotEmpty({ message: 'identifier is required' })
  @Transform(({ value }) => value?.trim())
  // Validate format — must be a valid email OR a valid E.164 phone
  @ValidateIf((o) => !isE164(o.identifier))
  @IsEmail({}, { message: 'identifier must be a valid email or E.164 phone number e.g. +254712345678' })
  @ValidateIf((o) => !isEmail(o.identifier))
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'identifier must be a valid email or E.164 phone number e.g. +254712345678',
  })
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password!: string;
}

// ── Helpers (module-level, not exported) ──────────────────────────────────────

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '');
}

function isE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value ?? '');
}