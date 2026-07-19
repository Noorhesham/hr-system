import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { UpsertAttendanceDto } from './upsert-attendance.dto';

/** Bulk import (device/CSV). Up to 500 rows; processed per-row (partial success). */
export class BulkAttendanceDto {
  @ApiProperty({ type: [UpsertAttendanceDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => UpsertAttendanceDto)
  records: UpsertAttendanceDto[];
}
