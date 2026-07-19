import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryMonthDto } from './dto/query-month.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(COMPANY_OWNER_ROLE)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Executive KPIs for the tenant. */
  @Get('dashboard')
  dashboard(@Tenant() companyId: string) {
    return this.reportsService.dashboard(companyId);
  }

  @Get('payroll-summary')
  payrollSummary(@Tenant() companyId: string, @Query() q: QueryMonthDto) {
    return this.reportsService.payrollSummary(companyId, q);
  }

  @Get('attendance-summary')
  attendanceSummary(@Tenant() companyId: string, @Query() q: QueryMonthDto) {
    return this.reportsService.attendanceSummary(companyId, q);
  }

  @Get('gosi')
  gosi(@Tenant() companyId: string, @Query() q: QueryMonthDto) {
    return this.reportsService.gosiSummary(companyId, q);
  }
}
