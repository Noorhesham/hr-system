import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  /** Create a PENDING loan for an employee (Company Owner only). */
  @Post('employees/:employeeId/loans')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: CreateLoanDto,
    examples: {
      default: { summary: 'New loan', value: { totalAmount: 12000 } },
    },
  })
  create(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateLoanDto,
  ) {
    return this.loanService.create(companyId, employeeId, dto);
  }

  /** List an employee's loans (with installments). */
  @Get('employees/:employeeId/loans')
  findAllForEmployee(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.loanService.findAllForEmployee(companyId, employeeId);
  }

  /** Company-wide, paginated list of loans (optional status/employee filter). */
  @Get('loans')
  findAll(@Tenant() companyId: string, @Query() query: QueryLoansDto) {
    return this.loanService.findAll(companyId, query);
  }

  /** Loan detail including its installment schedule. */
  @Get('loans/:id')
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.loanService.findOne(companyId, id);
  }

  /** Approve a loan and generate its installment schedule (Company Owner only). */
  @Patch('loans/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: ApproveLoanDto,
    examples: {
      byCount: {
        summary: 'Split into 6 equal installments',
        value: { numberOfInstallments: 6, startDate: '2026-08-01' },
      },
      byAmount: {
        summary: 'Fixed 2000/month (last absorbs remainder)',
        value: { installmentAmount: 2000, startDate: '2026-08-01' },
      },
    },
  })
  approve(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: ApproveLoanDto,
  ) {
    return this.loanService.approve(companyId, id, dto);
  }

  /** Delete a PENDING loan (Company Owner only). */
  @Delete('loans/:id')
  @Roles(COMPANY_OWNER_ROLE)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.loanService.remove(companyId, id);
  }
}
