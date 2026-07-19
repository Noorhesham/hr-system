import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /** Attach a document to an employee (Company Owner only). */
  @Post('employees/:employeeId/documents')
  @Roles(COMPANY_OWNER_ROLE)
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
  @Roles(COMPANY_OWNER_ROLE)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.documentService.remove(companyId, id);
  }
}
