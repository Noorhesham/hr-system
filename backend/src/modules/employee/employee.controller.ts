import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { BulkDeleteEmployeesDto } from './dto/bulk-delete-employees.dto';
import { QueryEmployeeAttendanceDto } from './dto/query-employee-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant } from '../tenant/decorators/tenant.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  /** Create an employee + portal account. */
  @Post()
  @Permissions(PERMISSIONS.CREATE_EMPLOYEE)
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
    },
  })
  create(@Tenant() companyId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(companyId, dto);
  }

  /**
   * Bulk import employees from CSV (multipart field `file`).
   * Header: name,email,basicSalary[,employmentType,salaryBasis,isGosiRegistered,gosiNumber]
   */
  @Post('import')
  @Permissions(PERMISSIONS.CREATE_EMPLOYEE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  importCsv(
    @Tenant() companyId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.employeeService.importFromCsv(companyId, file);
  }

  /** Hard-delete multiple employees (Company Owner only). Cascades related rows. */
  @Post('bulk-delete')
  @Permissions(PERMISSIONS.UPDATE_EMPLOYEE)
  @ApiBody({ type: BulkDeleteEmployeesDto })
  bulkDelete(
    @Tenant() companyId: string,
    @Body() dto: BulkDeleteEmployeesDto,
  ) {
    return this.employeeService.bulkRemove(companyId, dto.ids);
  }

  /** Paginated + searchable list of the tenant's employees. */
  @Get()
  findAll(@Tenant() companyId: string, @Query() query: QueryEmployeesDto) {
    return this.employeeService.findAll(companyId, query);
  }

  /** Distinct department labels for UI filters. */
  @Get('departments')
  listDepartments(@Tenant() companyId: string) {
    return this.employeeService.listDepartments(companyId);
  }

  @Get(':id/payroll-slips')
  listPayrollSlips(
    @Tenant() companyId: string,
    @Param('id') id: string,
  ) {
    return this.employeeService.listPayrollSlips(companyId, id);
  }

  @Get(':id/leaves')
  listLeaves(@Tenant() companyId: string, @Param('id') id: string) {
    return this.employeeService.listLeaves(companyId, id);
  }

  @Get(':id/attendance')
  listAttendance(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Query() query: QueryEmployeeAttendanceDto,
  ) {
    return this.employeeService.listAttendance(companyId, id, {
      page: query.page,
      limit: query.limit,
      skip: query.skip,
      from: query.from,
      to: query.to,
      prismaOrder: query.prismaOrder,
    });
  }

  @Get(':id')
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.employeeService.findOne(companyId, id);
  }

  /** Update an employee — incl. `isActive: false` for resignation (Company Owner only). */
  @Patch(':id')
  @Permissions(PERMISSIONS.UPDATE_EMPLOYEE)
  @ApiBody({
    type: UpdateEmployeeDto,
    examples: {
      default: {
        summary: 'Update',
        value: { basicSalary: 6000, isActive: true },
      },
    },
  })
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(companyId, id, dto);
  }

  /** Hard-delete one employee (Company Owner only). Cascades related rows. */
  @Delete(':id')
  @Permissions(PERMISSIONS.UPDATE_EMPLOYEE)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.employeeService.remove(companyId, id);
  }
}
