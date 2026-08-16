import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

/** Query attendance history for one employee. */
export class QueryEmployeeAttendanceDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
