import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  /** Create an employee + portal account (Company Owner only). */
  @Post()
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: CreateEmployeeDto,
    examples: {
      monthly: {
        summary: 'Monthly salary',
        value: {
          name: 'Ahmed Ali',
          email: 'ahmed@acme.com',
          basicSalary: 5000,
          employmentType: 'PERMANENT',
          salaryBasis: 'MONTHLY',
          isGosiRegistered: false,
        },
      },
      daily: {
        summary: 'Daily wage (SAR per PRESENT day)',
        value: {
          name: 'Yousef Daily',
          email: 'yousef.daily@acme.com',
          basicSalary: 200,
          employmentType: 'TEMPORARY',
          salaryBasis: 'DAILY',
          isGosiRegistered: false,
        },
      },
      hourly: {
        summary: 'Hourly wage (SAR per regular hour)',
        value: {
          name: 'Maha Hourly',
          email: 'maha.hourly@acme.com',
          basicSalary: 25,
          employmentType: 'CONTRACT',
          salaryBasis: 'HOURLY',
          isGosiRegistered: false,
        },
      },
    },
  })
  create(@Tenant() companyId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(companyId, dto);
  }

  /** Paginated + searchable list of the tenant's employees. */
  @Get()
  findAll(@Tenant() companyId: string, @Query() query: QueryEmployeesDto) {
    return this.employeeService.findAll(companyId, query);
  }

  @Get(':id')
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.employeeService.findOne(companyId, id);
  }

  /** Update an employee — incl. `isActive: false` for resignation (Company Owner only). */
  @Patch(':id')
  @Roles(COMPANY_OWNER_ROLE)
  @ApiBody({
    type: UpdateEmployeeDto,
    examples: {
      default: { summary: 'Update', value: { basicSalary: 6000, isActive: true } },
    },
  })
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(companyId, id, dto);
  }
}
