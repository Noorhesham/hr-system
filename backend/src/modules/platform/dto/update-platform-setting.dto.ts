import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Partial update of the global platform settings (Super Admin only). */
export class UpdatePlatformSettingDto {
  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 100000,
    description: 'Seat cap applied to trial / no-plan companies',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  defaultTrialMaxEmployees?: number;

  @ApiPropertyOptional({
    example: 14,
    minimum: 1,
    maximum: 365,
    description: 'Trial length in days, applied at company registration',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  trialDays?: number;
}
