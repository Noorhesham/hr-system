import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalaryComponentType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * A recurring salary line item (allowance or deduction) for an employee.
 * When `isPercentage` is true, `amount` is a percentage of the basic salary
 * (0–100, validated in the service); otherwise it is a fixed monetary amount.
 */
export class CreateSalaryComponentDto {
  @ApiProperty({ enum: SalaryComponentType, example: SalaryComponentType.ALLOWANCE })
  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @ApiProperty({ example: 'Housing', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 1000,
    minimum: 0,
    description: 'Fixed amount, or a 0–100 percentage when isPercentage is true.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: false,
    description: 'When true, amount is a percentage of the basic salary.',
  })
  @IsOptional()
  @IsBoolean()
  isPercentage?: boolean;
}
