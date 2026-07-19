import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { SalaryComponentService } from './salary-component.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Salary Components')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class SalaryComponentController {
  constructor(
    private readonly salaryComponentService: SalaryComponentService,
  ) {}

  /** Add a recurring allowance/deduction to an employee (Company Owner only). */
  @Post('employees/:employeeId/salary-components')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: CreateSalaryComponentDto,
    examples: {
      allowance: {
        summary: 'Fixed housing allowance',
        value: { type: 'ALLOWANCE', name: 'Housing', amount: 1000, isPercentage: false },
      },
      percentage: {
        summary: 'Percentage-based allowance',
        value: { type: 'ALLOWANCE', name: 'Transport', amount: 10, isPercentage: true },
      },
    },
  })
  create(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateSalaryComponentDto,
  ) {
    return this.salaryComponentService.create(companyId, employeeId, dto);
  }

  /** List an employee's salary components. */
  @Get('employees/:employeeId/salary-components')
  findAll(
    @Tenant() companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.salaryComponentService.findAllForEmployee(companyId, employeeId);
  }

  /** Update a salary component (Company Owner only). */
  @Patch('salary-components/:id')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: UpdateSalaryComponentDto,
    examples: {
      default: { summary: 'Update amount', value: { amount: 1500 } },
    },
  })
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalaryComponentDto,
  ) {
    return this.salaryComponentService.update(companyId, id, dto);
  }

  /** Remove a salary component (Company Owner only). */
  @Delete('salary-components/:id')
  @Roles(COMPANY_OWNER_ROLE)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.salaryComponentService.remove(companyId, id);
  }
}
