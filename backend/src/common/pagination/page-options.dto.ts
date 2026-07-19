import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** Treat blank query-string values (`?orderBy=&search=`) as "not provided". */
function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export class PageOptionsDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  orderBy: string = 'createdAt';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit: number = 10;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  search?: string;

  get skip() {
    return (this.page - 1) * this.limit;
  }

  /** Safe sort direction for Prisma (never empty/invalid). */
  get prismaOrder(): 'asc' | 'desc' {
    return this.order === 'asc' ? 'asc' : 'desc';
  }
}
