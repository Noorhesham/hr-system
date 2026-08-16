import { ApiPropertyOptional } from '@nestjs/swagger';
import { DelayDeductionType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Partial update of a company's CompanyPolicy. Every field is optional (PATCH
 * semantics); omitted fields are left untouched. Decimal columns accept a
 * number with up to 2 decimal places.
 */
export class UpdatePolicyDto {
  @ApiPropertyOptional({
    enum: DelayDeductionType,
    example: DelayDeductionType.PER_MINUTE,
  })
  @IsOptional()
  @IsEnum(DelayDeductionType)
  delayDeductionType?: DelayDeductionType;

  // ─── Absence multipliers (× the daily rate) ──────────────────────────────
  @ApiPropertyOptional({ example: 1.0, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  absenceMultiplierUnexcused?: number;

  @ApiPropertyOptional({ example: 0.5, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  absenceMultiplierExcused?: number;

  // ─── Overtime multipliers (× the hourly rate) ────────────────────────────
  @ApiPropertyOptional({ example: 1.5, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  overtimeMultiplierNormal?: number;

  @ApiPropertyOptional({ example: 2.0, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  overtimeMultiplierHoliday?: number;

  // ─── GOSI percentages ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 9.75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  gosiEmployeePercentage?: number;

  @ApiPropertyOptional({ example: 11.75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  gosiCompanyPercentage?: number;

  @ApiPropertyOptional({ example: 'GOSI-99887', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gosiNumber?: string;

  // ─── Weekend days (e.g. ["FRIDAY", "SATURDAY"]) ──────────────────────────
  @ApiPropertyOptional({ type: [String], example: ['FRIDAY', 'SATURDAY'] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  defaultWeekendDays?: string[];

  // ─── Payroll preferences ─────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'SAR', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    example: 'MONTHLY',
    description: 'MONTHLY | BIWEEKLY | WEEKLY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  payrollCycle?: string;

  @ApiPropertyOptional({ example: 27, minimum: 1, maximum: 31 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  payrollPayoutDay?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  directBankTransfer?: boolean;

  // ─── Benefits / insurance ────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'bupa', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  medicalInsuranceProvider?: string;

  @ApiPropertyOptional({ example: 'B', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  medicalInsuranceTier?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  gosiAutoEnroll?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  benefitHousingAllowance?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  benefitTransportAllowance?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  benefitAnnualTickets?: boolean;

  @ApiPropertyOptional({
    example: 25,
    description:
      'Housing amount. Interpreted as % of basic when benefitHousingAllowanceIsPercentage is true, otherwise fixed SAR/month.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  benefitHousingAllowanceAmount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'When true, benefitHousingAllowanceAmount is a percentage (0–100).',
  })
  @IsOptional()
  @IsBoolean()
  benefitHousingAllowanceIsPercentage?: boolean;

  @ApiPropertyOptional({
    example: 500,
    description: 'Fixed monthly transport allowance in company currency.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  benefitTransportAllowanceAmount?: number;

  @ApiPropertyOptional({
    example: 3600,
    description:
      'Annual tickets value (yearly). Synced to employees as amount/12 monthly SalaryComponent.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  benefitAnnualTicketsAmount?: number;
}
