import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Payload for `POST /auth/register` — provisions a new tenant + admin user. */
export class RegisterDto {
  @ApiProperty({ example: 'Acme Operations', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  companyName: string;

  @ApiProperty({ example: 'admin@acme.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'أحمد الحربي', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: '0501234567', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'مدير الموارد البشرية', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiProperty({
    example: 'Passw0rd!',
    minLength: 8,
    maxLength: 72,
    description:
      'Must contain at least one lowercase letter, one uppercase letter and one number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt only hashes the first 72 bytes
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'password must contain at least one lowercase letter, one uppercase letter and one number',
  })
  password: string;

  @ApiPropertyOptional({
    example: '1-2345678',
    maxLength: 50,
    description: 'MOL/WPS establishment number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  establishmentNumber?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Optional. Omit to create the company with NO plan (stays on TRIAL).',
  })
  @IsOptional()
  @IsString()
  planId?: string;
}

/** Payload for `POST /auth/login`. */
export class LoginDto {
  @ApiProperty({ example: 'admin@acme.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/** Payload for `POST /auth/change-password` (authenticated — any user). */
export class ChangePasswordDto {
  @ApiProperty({ example: 'Passw0rd!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassw0rd!',
    minLength: 8,
    maxLength: 72,
    description:
      'Must contain at least one lowercase letter, one uppercase letter and one number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'newPassword must contain at least one lowercase letter, one uppercase letter and one number',
  })
  newPassword: string;
}

/**
 * Payload for `PATCH /auth/profile` — update display fields.
 * Email is intentionally omitted and cannot be changed here.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'أحمد الحربي', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: '0501234567', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'مدير الموارد البشرية', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;
}

/** Payload for `POST /auth/forgot-password`. */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'owner@najd.sa', format: 'email' })
  @IsEmail()
  email: string;
}

/** Payload for `POST /auth/verify-reset-otp`. */
export class VerifyResetOtpDto {
  @ApiProperty({ example: 'owner@najd.sa', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP from email / logs' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code: string;
}

/** Payload for `POST /auth/reset-password` (after OTP verify). */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Short-lived reset token returned by verify-reset-otp',
  })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({
    example: 'NewPassw0rd!',
    minLength: 8,
    maxLength: 72,
    description:
      'Must contain at least one lowercase letter, one uppercase letter and one number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'newPassword must contain at least one lowercase letter, one uppercase letter and one number',
  })
  newPassword: string;
}
