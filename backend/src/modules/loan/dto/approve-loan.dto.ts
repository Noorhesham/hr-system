import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

/**
 * Approves a loan and generates its monthly installment schedule.
 * Provide EXACTLY ONE of `numberOfInstallments` or `installmentAmount`
 * (validated in the service), plus the `startDate` of the first installment.
 */
export class ApproveLoanDto {
  @ApiPropertyOptional({
    example: 6,
    description: 'Split the total into this many equal monthly installments.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(240)
  numberOfInstallments?: number;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Fixed monthly installment amount (the last one absorbs any remainder).',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  installmentAmount?: number;

  @ApiProperty({
    example: '2026-08-01',
    description: 'Due date of the first installment; each following one is +1 month.',
  })
  @IsDateString()
  startDate: string;
}
