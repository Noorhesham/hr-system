import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollCycleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

export class QueryPayrollCyclesDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: PayrollCycleStatus })
  @IsOptional()
  @IsEnum(PayrollCycleStatus)
  status?: PayrollCycleStatus;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
