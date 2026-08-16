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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Tenant, CurrentUser } from '../tenant/decorators/tenant.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RoleService } from './role.service';
import {
  AssignUserRoleDto,
  CreateRoleDto,
  UnassignUsersDto,
  UpdateRoleDto,
} from './dto/role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roles: RoleService) {}

  @Get('permissions')
  @Permissions(PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES)
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Get('roles')
  @Permissions(PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES)
  listRoles(@Tenant() companyId: string) {
    return this.roles.listRoles(companyId);
  }

  @Get('roles/users')
  @Permissions(PERMISSIONS.MANAGE_ROLES)
  listUsers(@Tenant() companyId: string) {
    return this.roles.listUsers(companyId);
  }

  @Get('roles/:id/users')
  @Permissions(PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES)
  listRoleUsers(@Tenant() companyId: string, @Param('id') id: string) {
    return this.roles.listRoleUsers(companyId, id);
  }

  @Get('roles/:id')
  @Permissions(PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES)
  findOne(@Tenant() companyId: string, @Param('id') id: string) {
    return this.roles.findOne(companyId, id);
  }

  @Post('roles')
  @Permissions(PERMISSIONS.MANAGE_ROLES)
  create(@Tenant() companyId: string, @Body() dto: CreateRoleDto) {
    return this.roles.create(companyId, dto);
  }

  @Patch('roles/:id')
  @Permissions(PERMISSIONS.MANAGE_ROLES)
  update(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roles.update(companyId, id, dto);
  }

  @Post('roles/:id/users/unassign')
  @Permissions(PERMISSIONS.MANAGE_ROLES)
  unassignUsers(
    @Tenant() companyId: string,
    @Param('id') id: string,
    @Body() dto: UnassignUsersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.roles.unassignUsers(companyId, id, dto, actor);
  }

  @Delete('roles/:id')
  @Permissions(PERMISSIONS.MANAGE_ROLES)
  remove(@Tenant() companyId: string, @Param('id') id: string) {
    return this.roles.remove(companyId, id);
  }

  @Patch('users/:userId/role')
  @Permissions(PERMISSIONS.MANAGE_ROLES)
  assignUserRole(
    @Tenant() companyId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.roles.assignUserRole(companyId, userId, dto, actor);
  }
}
