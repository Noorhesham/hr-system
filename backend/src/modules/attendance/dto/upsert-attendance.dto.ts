import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** Manual admin create/upsert of a day's record. Metrics are derived unless overridden. */
export class UpsertAttendanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-06-29', description: 'Calendar day (tenant-local).' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ example: '2026-06-29T08:05:00+03:00' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-06-29T17:30:00+03:00' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ minimum: 0, description: 'Manual override of derived delay.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  delayMinutes?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Manual override of derived overtime.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overtimeHours?: number;
}
