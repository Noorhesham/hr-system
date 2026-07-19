import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HH_MM_REGEX } from '../../../common/constants/time.constant';

export class UpdateShiftDto {
  @ApiPropertyOptional({ example: 'Morning', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(HH_MM_REGEX, { message: 'startTime must be a valid 24-hour HH:mm' })
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  @Matches(HH_MM_REGEX, { message: 'endTime must be a valid 24-hour HH:mm' })
  endTime?: string;

  @ApiPropertyOptional({ example: 15, minimum: 0, maximum: 240 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  gracePeriodMinutes?: number;
}
