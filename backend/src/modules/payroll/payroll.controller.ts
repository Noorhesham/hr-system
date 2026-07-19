import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PayrollService } from './payroll.service';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  /** Open a DRAFT cycle for month/year and calculate all active employees. */
  @Post('cycles')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: CreatePayrollCycleDto,
    examples: {
      default: {
        summary: 'July 2026 payroll',
        value: { month: 7, year: 2026 },
      },
    },
  })
  create(@Tenant() companyId: string, @Body() dto: CreatePayrollCycleDto) {
    return this.payrollService.createCycle(companyId, dto);
  }

  @Get('cycles')
  findAll(@Tenant() companyId: string, @Query() query: QueryPayrollCyclesDto) {
    return this.payrollService.findAll(companyId, query);
  }

  @Get('cycles/:id')
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.payrollService.findOne(companyId, id);
  }

  @Get('slips/:slipId')
  findSlip(@Tenant() companyId: string, @Param('slipId') slipId: string) {
    return this.payrollService.findSlip(companyId, slipId);
  }

  /** Re-run the engine (DRAFT only). */
  @Post('cycles/:id/recalculate')
  @HttpCode(HttpStatus.OK)
  @Roles(COMPANY_OWNER_ROLE)
  recalculate(@Tenant() companyId: string, @Param('id') id: string) {
    return this.payrollService.recalculate(companyId, id);
  }

  /** DRAFT → REVIEW */
  @Patch('cycles/:id/review')
  @Roles(COMPANY_OWNER_ROLE)
  review(@Tenant() companyId: string, @Param('id') id: string) {
    return this.payrollService.moveToReview(companyId, id);
  }

  /** REVIEW → APPROVED (locks loan installments as DEDUCTED). */
  @Patch('cycles/:id/approve')
  @Roles(COMPANY_OWNER_ROLE)
  approve(@Tenant() companyId: string, @Param('id') id: string) {
    return this.payrollService.approve(companyId, id);
  }

  /** APPROVED → CLOSED (final). */
  @Patch('cycles/:id/close')
  @Roles(COMPANY_OWNER_ROLE)
  close(@Tenant() companyId: string, @Param('id') id: string) {
    return this.payrollService.close(companyId, id);
  }

  /** WPS CSV export (APPROVED or CLOSED). */
  @Get('cycles/:id/wps')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportWps(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.payrollService.exportWps(companyId, id);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.setHeader('Content-Type', file.contentType);
    res.send(file.body);
  }
}
