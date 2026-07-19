import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Adds a document record to an employee (metadata + URL; upload comes later). */
export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.NATIONAL_ID })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({
    example: '2027-12-31',
    description: 'Expiry date (drives renewal reminders).',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://files.example.com/id.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fileUrl?: string;

  @ApiPropertyOptional({ example: '1234567890', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentNumber?: string;
}
