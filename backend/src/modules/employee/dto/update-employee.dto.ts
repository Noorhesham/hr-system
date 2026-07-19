import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, SalaryBasis } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Partial employee update. Note: `email` is NOT updatable here (it belongs to
 * the linked login account). Set `isActive: false` to deactivate (resignation).
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Ahmed Ali', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 6000, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: SalaryBasis })
  @IsOptional()
  @IsEnum(SalaryBasis)
  salaryBasis?: SalaryBasis;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Set to false to deactivate the employee (resignation).',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isGosiRegistered?: boolean;

  @ApiPropertyOptional({ example: '123456789', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gosiNumber?: string;
}
