import { ApiPropertyOptional } from '@nestjs/swagger';
import { DelayDeductionType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
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
}
