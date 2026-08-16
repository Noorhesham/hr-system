import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus, RequestType } from '@prisma/client';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

export class CreateRequestDto {
  @ApiProperty({ enum: RequestType })
  @IsEnum(RequestType)
  type: RequestType;

  @ApiPropertyOptional({
    description: 'Create on behalf of employee (admin). Portal users omit.',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Required for GENERAL' })
  @ValidateIf((o) => o.type === RequestType.GENERAL)
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Required for OVERTIME (YYYY-MM-DD)' })
  @ValidateIf((o) => o.type === RequestType.OVERTIME)
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Required for OVERTIME' })
  @ValidateIf((o) => o.type === RequestType.OVERTIME)
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(24)
  hours?: number;
}

export class RejectRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class QueryRequestsDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ enum: RequestType })
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Only the current user\'s employee requests',
  })
  @IsOptional()
  mine?: string;
}
