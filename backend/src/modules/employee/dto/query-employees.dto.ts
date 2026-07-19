import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

/**
 * Query for listing employees. Inherits `page`, `limit`, `order`, `orderBy`,
 * `search` (matches employee name) from PageOptionsDto.
 */
export class QueryEmployeesDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
