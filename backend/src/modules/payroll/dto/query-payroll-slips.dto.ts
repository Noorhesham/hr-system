import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

/** Paginated slips inside one payroll cycle. */
export class QueryPayrollSlipsDto extends PageOptionsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
