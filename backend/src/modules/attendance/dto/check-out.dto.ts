import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * Punch out.
 * - Portal employee: omit `employeeId` (self only).
 * - Company Owner: must pass `employeeId`.
 */
export class CheckOutDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Required for Company Owner. Portal employees must omit this (self only).',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    example: '2026-06-29T17:30:00+03:00',
    description: 'ISO timestamp (include offset or Z). Defaults to now.',
  })
  @IsOptional()
  @IsDateString()
  at?: string;
}
