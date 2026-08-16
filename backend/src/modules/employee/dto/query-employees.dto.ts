import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
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

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter by department id',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by department label (exact match) — prefer departmentId',
    example: 'الهندسة',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description:
      'Account status filter: ACTIVE | INACTIVE | ON_LEAVE (approved leave covering today)',
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

  @ApiPropertyOptional({
    description:
      'Only employees eligible as direct managers: jobRank TEAM_LEAD / DEPARTMENT_MANAGER, or linked Company Owner user',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  managersOnly?: boolean;
}
