import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant } from '../tenant/decorators/tenant.decorator';
import { DepartmentService } from './department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { QueryDepartmentsDto } from './dto/query-departments.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Permissions(PERMISSIONS.MANAGE_DEPARTMENTS)
  @ApiBody({ type: CreateDepartmentDto })
  create(@Tenant() companyId: string, @Body() dto: CreateDepartmentDto) {
    return this.departmentService.create(companyId, dto);
  }

  @Get()
  findAll(@Tenant() companyId: string, @Query() query: QueryDepartmentsDto) {
    return this.departmentService.findAll(companyId, query);
  }

  /** Unpaginated options for employee create/edit/filter selects. */
  @Get('options')
  listOptions(@Tenant() companyId: string) {
    return this.departmentService.listOptions(companyId);
  }

  @Get(':id')
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.departmentService.findOne(companyId, id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.MANAGE_DEPARTMENTS)
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MANAGE_DEPARTMENTS)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.departmentService.remove(companyId, id);
  }
}
