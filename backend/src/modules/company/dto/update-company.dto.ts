import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Partial update of tenant company profile (onboarding / settings). */
export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Najd Trading Co.', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'https://www.example.com', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: 'retail', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  industry?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../logo.png',
    description: 'CDN URL returned by POST /uploads',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: '1-7001234', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  establishmentNumber?: string;
}
