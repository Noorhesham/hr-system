import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * Punch in.
 * - Portal employee: omit `employeeId` (always punches for self).
 * - Company Owner: must pass `employeeId` of the employee to punch for.
 * A shift must already be assigned to the employee (or passed here).
 */
export class CheckInDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Required for Company Owner. Portal employees must omit this (self only).',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    example: '2026-06-29T08:05:00+03:00',
    description: 'ISO timestamp (include offset or Z). Defaults to now.',
  })
  @IsOptional()
  @IsDateString()
  at?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: "Override the employee's default shift for this day.",
  })
  @IsOptional()
  @IsString()
  shiftId?: string;
}
