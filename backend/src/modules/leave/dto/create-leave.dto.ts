import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateLeaveDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Employee requesting leave. Portal users omit this (always self).' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2026-08-12' })
  @IsDateString()
  toDate: string;

  @ApiPropertyOptional({ example: 'إجازة سنوية', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RejectLeaveDto {
  @ApiPropertyOptional({ example: 'تعارض مع جدول العمل', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
