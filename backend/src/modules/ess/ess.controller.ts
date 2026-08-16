import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EssService } from './ess.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../tenant/decorators/tenant.decorator';
import { EMPLOYEE_ROLE } from '../../common/constants/roles.constant';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PageOptionsDto } from '../../common/pagination/page-options.dto';
import { CreateLoanDto } from '../loan/dto/create-loan.dto';

@ApiTags('ESS')
@ApiBearerAuth()
@Controller('ess')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(EMPLOYEE_ROLE)
export class EssController {
  constructor(private readonly essService: EssService) {}

  /** Portal home: user + employee profile + assigned shift. */
  @Get('me')
  me(@CurrentUser() actor: AuthenticatedUser) {
    return this.essService.me(actor);
  }

  @Get('home')
  home(@CurrentUser() actor: AuthenticatedUser) {
    return this.essService.home(actor);
  }

  @Get('salary-components')
  salaryComponents(@CurrentUser() actor: AuthenticatedUser) {
    return this.essService.mySalaryComponents(actor);
  }

  @Get('documents')
  documents(@CurrentUser() actor: AuthenticatedUser) {
    return this.essService.myDocuments(actor);
  }

  @Get('attendance')
  attendance(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: PageOptionsDto,
  ) {
    return this.essService.myAttendance(actor, query);
  }

  @Get('loans')
  loans(@CurrentUser() actor: AuthenticatedUser) {
    return this.essService.myLoans(actor);
  }

  /** Portal employee requests a PENDING loan for themselves. */
  @Post('loans')
  requestLoan(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateLoanDto,
  ) {
    return this.essService.requestLoan(actor, dto.totalAmount);
  }

  @Get('payslips')
  payslips(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: PageOptionsDto,
  ) {
    return this.essService.myPayslips(actor, query);
  }

  @Get('payslips/:id')
  payslip(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.essService.myPayslip(actor, id);
  }
}
