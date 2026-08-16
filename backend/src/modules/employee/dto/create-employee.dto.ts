import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmploymentType,
  Gender,
  JobRank,
  MaritalStatus,
  SalaryBasis,
  WorkLocation,
} from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
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

  @ApiPropertyOptional({ example: '501234567', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../photo.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ example: '29801234567890', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nationalId?: string;

  @ApiPropertyOptional({ example: '1995-04-21' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 'الرياض، حي النرجس', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant department id (preferred over free-text department)',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    example: 'الهندسة',
    maxLength: 120,
    deprecated: true,
    description: 'Prefer departmentId. Kept for backward compatibility.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional({ example: 'هندسة البرمجيات', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subDepartment?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  managerId?: string | null;

  @ApiPropertyOptional({ example: 'UI/UX Designer', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @ApiPropertyOptional({ enum: EmploymentType, example: EmploymentType.PERMANENT })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  contractDurationYears?: number;

  @ApiPropertyOptional({ enum: WorkLocation })
  @IsOptional()
  @IsEnum(WorkLocation)
  workLocation?: WorkLocation;

  @ApiPropertyOptional({ example: '2026-04-21' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ enum: JobRank })
  @IsOptional()
  @IsEnum(JobRank)
  jobRank?: JobRank;

  @ApiPropertyOptional({ example: 90, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  probationDays?: number;

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

  @ApiPropertyOptional({ example: 'البنك الأهلي', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @ApiPropertyOptional({ example: 'SA0380000000608010167519', maxLength: 34 })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isGosiRegistered?: boolean;

  @ApiPropertyOptional({ example: '123456789', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gosiNumber?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasHealthInsurance?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasTransportAllowance?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasHousingAllowance?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasMealAllowance?: boolean;
}
