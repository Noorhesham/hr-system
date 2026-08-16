import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryMonthDto } from './dto/query-month.dto';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant } from '../tenant/decorators/tenant.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
@Permissions(PERMISSIONS.VIEW_REPORTS)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Executive KPIs for the tenant (optional from/to; defaults last→current month). */
  @Get('dashboard')
  dashboard(
    @Tenant() companyId: string,
    @Query() query: QueryDashboardDto,
  ) {
    return this.reportsService.dashboard(companyId, query);
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
