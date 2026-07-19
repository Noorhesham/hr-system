import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, SalaryBasis } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** Creates an employee + an auto-provisioned portal login account. */
export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ahmed Ali', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'ahmed@acme.com',
    format: 'email',
    description: 'Login email for the auto-created portal account (unique).',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 5000, minimum: 0, description: 'Basic salary' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basicSalary: number;

  @ApiPropertyOptional({ enum: EmploymentType, example: EmploymentType.PERMANENT })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: SalaryBasis, example: SalaryBasis.MONTHLY })
  @IsOptional()
  @IsEnum(SalaryBasis)
  salaryBasis?: SalaryBasis;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional shift to assign (must belong to your company).',
  })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isGosiRegistered?: boolean;

  @ApiPropertyOptional({ example: '123456789', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gosiNumber?: string;
}
