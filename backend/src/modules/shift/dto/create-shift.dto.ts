import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HH_MM_REGEX } from '../../../common/constants/time.constant';

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: '08:00', description: '24-hour HH:mm' })
  @IsString()
  @Matches(HH_MM_REGEX, { message: 'startTime must be a valid 24-hour HH:mm' })
  startTime: string;

  @ApiProperty({
    example: '17:00',
    description: '24-hour HH:mm. May be <= startTime for overnight shifts.',
  })
  @IsString()
  @Matches(HH_MM_REGEX, { message: 'endTime must be a valid 24-hour HH:mm' })
  endTime: string;

  @ApiPropertyOptional({ example: 15, minimum: 0, maximum: 240 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  gracePeriodMinutes?: number;
}
