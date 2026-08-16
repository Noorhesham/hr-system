import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { memoryStorage } from 'multer';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant } from '../tenant/decorators/tenant.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly uploads: UploadService,
  ) {}

  /** Attach a document to an employee (Company Owner only) — metadata + URL. */
  @Post('employees/:employeeId/documents')
  @Permissions(PERMISSIONS.MANAGE_DOCUMENTS)
  @ApiBody({
    type: CreateDocumentDto,
    examples: {
      default: {
        summary: 'Add document',
        value: {
          type: 'NATIONAL_ID',
          expiryDate: '2027-12-31',
          documentNumber: '1234567890',
          fileUrl: 'https://files.example.com/id.pdf',
        },
      },
    },
  })
  create(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentService.create(companyId, employeeId, dto);
  }

  /**
   * Upload a real file to Cloudinary, then attach the document record.
   * Multipart fields: file (required), type, expiryDate?, documentNumber?
   */
  @Post('employees/:employeeId/documents/upload')
  @Permissions(PERMISSIONS.MANAGE_DOCUMENTS)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: Object.values(DocumentType) },
        expiryDate: { type: 'string', example: '2027-12-31' },
        documentNumber: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async uploadAndCreate(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      type?: string;
      expiryDate?: string;
      documentNumber?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (
      !body.type ||
      !Object.values(DocumentType).includes(body.type as DocumentType)
    ) {
      throw new BadRequestException('type must be a valid DocumentType');
    }
    const uploaded = await this.uploads.uploadBuffer(
      file,
      'hr-system/documents',
    );
    return this.documentService.create(companyId, employeeId, {
      type: body.type as DocumentType,
      expiryDate: body.expiryDate,
      documentNumber: body.documentNumber,
      fileUrl: uploaded.url,
    });
  }

  /** List an employee's documents. */
  @Get('employees/:employeeId/documents')
  findAll(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.documentService.findAllForEmployee(companyId, employeeId);
  }

  /** Documents across the company expiring within `days` (default 30). */
  @Get('documents/expiring')
  findExpiring(@Tenant() companyId: string, @Query('days') days?: string) {
    const parsed = Number(days);
    const window = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    return this.documentService.findExpiring(companyId, window);
  }

  @Delete('documents/:id')
  @Permissions(PERMISSIONS.MANAGE_DOCUMENTS)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.documentService.remove(companyId, id);
  }
}
