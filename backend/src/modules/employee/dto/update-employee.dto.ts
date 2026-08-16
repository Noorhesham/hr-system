import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, JobRank, SalaryBasis, WorkLocation } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Partial employee update. Note: `email` is NOT updatable here (it belongs to
 * the linked login account). Set `isActive: false` to deactivate (resignation).
 * `phone` updates the linked User.phone when a portal user exists.
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

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Clear with null.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  shiftId?: string | null;

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

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Tenant department id. Null clears.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({
    example: 'الهندسة',
    maxLength: 120,
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional({ example: 'مهندس برمجيات', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Direct manager employee id (same company). Null clears.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  managerId?: string | null;

  @ApiPropertyOptional({ enum: JobRank })
  @IsOptional()
  @IsEnum(JobRank)
  jobRank?: JobRank;

  @ApiPropertyOptional({ enum: WorkLocation })
  @IsOptional()
  @IsEnum(WorkLocation)
  workLocation?: WorkLocation;

  @ApiPropertyOptional({
    example: 1,
    minimum: 0,
    description: 'Contract length in years.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  contractDurationYears?: number | null;

  @ApiPropertyOptional({
    example: '501234567',
    maxLength: 30,
    nullable: true,
    description: 'Updates linked portal User.phone when present. Null clears.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(30)
  phone?: string | null;
}
