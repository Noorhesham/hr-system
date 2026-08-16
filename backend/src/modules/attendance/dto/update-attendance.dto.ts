import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

/** Correct a record. `employeeId`/`date` are immutable (they form the unique key). */
export class UpdateAttendanceDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({
    example: '2026-06-29T08:05:00+03:00',
    nullable: true,
    description: 'Pass null to clear check-in (required when marking ABSENT/LEAVE).',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDateString()
  checkIn?: string | null;

  @ApiPropertyOptional({
    example: '2026-06-29T17:30:00+03:00',
    nullable: true,
    description: 'Pass null to clear check-out (required when marking ABSENT/LEAVE).',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDateString()
  checkOut?: string | null;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  delayMinutes?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overtimeHours?: number;
}
