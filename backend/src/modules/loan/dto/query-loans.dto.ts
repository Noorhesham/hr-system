import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

/** List loans across the tenant. Inherits page/limit/order/orderBy. */
export class QueryLoansDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
