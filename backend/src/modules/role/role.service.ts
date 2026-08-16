import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  COMPANY_OWNER_ROLE,
  EMPLOYEE_ROLE,
} from '../../common/constants/roles.constant';
import { SYSTEM_ROLE_NAMES } from '../../common/constants/permissions.constant';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  AssignUserRoleDto,
  CreateRoleDto,
  UnassignUsersDto,
  UpdateRoleDto,
} from './dto/role.dto';

const LOCKED_NAMES = new Set<string>([COMPANY_OWNER_ROLE, EMPLOYEE_ROLE]);

function employeeCodeFromId(id: string): string {
  const hex = id.replace(/-/g, '').slice(-4);
  const n = (parseInt(hex, 16) % 9000) + 1000;
  return `EMP-${n}`;
}

@Injectable()
export class RoleService {
  constructor(private readonly db: DatabaseService) {}

  listPermissions() {
    return this.db.permission.findMany({
      orderBy: { action: 'asc' },
      select: { id: true, action: true },
    });
  }

  async listRoles(companyId: string) {
    const roles = await this.db.role.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      include: {
        permissions: { select: { id: true, action: true } },
        _count: { select: { users: true } },
      },
    });
    return roles.map((r) => this.mapRole(r));
  }

  async findOne(companyId: string, roleId: string) {
    const role = await this.db.role.findFirst({
      where: { id: roleId, companyId },
      include: {
        permissions: { select: { id: true, action: true } },
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return this.mapRole(role);
  }

  async listRoleUsers(companyId: string, roleId: string) {
    await this.findRoleOrThrow(companyId, roleId);
    const users = await this.db.user.findMany({
      where: { companyId, roleId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPortalUser: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
            department: true,
            departmentId: true,
          },
        },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName ?? u.employee?.name ?? null,
      isPortalUser: u.isPortalUser,
      assignedAt: u.updatedAt.toISOString(),
      employeeId: u.employee?.id ?? null,
      employeeCode: u.employee ? employeeCodeFromId(u.employee.id) : null,
      department: u.employee?.department ?? null,
      departmentId: u.employee?.departmentId ?? null,
      photoUrl: u.employee?.photoUrl ?? null,
    }));
  }

  async create(companyId: string, dto: CreateRoleDto) {
    const name = dto.name.trim();
    if ((SYSTEM_ROLE_NAMES as readonly string[]).includes(name)) {
      throw new BadRequestException('Cannot create a role with a system name');
    }
    const existing = await this.db.role.findUnique({
      where: { companyId_name: { companyId, name } },
    });
    if (existing) {
      throw new BadRequestException('Role name already exists');
    }
    const perms = await this.resolvePermissions(dto.permissionActions ?? []);
    const role = await this.db.role.create({
      data: {
        companyId,
        name,
        description: dto.description?.trim() || null,
        permissions: { connect: perms.map((p) => ({ id: p.id })) },
      },
      include: {
        permissions: { select: { id: true, action: true } },
        _count: { select: { users: true } },
      },
    });
    return this.mapRole(role);
  }

  async update(companyId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.findRoleOrThrow(companyId, roleId);
    if (LOCKED_NAMES.has(role.name) && dto.name && dto.name.trim() !== role.name) {
      throw new ForbiddenException('Cannot rename system Owner/Employee roles');
    }
    if (role.name === COMPANY_OWNER_ROLE && dto.permissionActions) {
      throw new ForbiddenException('Cannot change Company Owner permissions');
    }

    const data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
      permissions?: { set: { id: string }[] };
    } = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (
        name !== role.name &&
        (SYSTEM_ROLE_NAMES as readonly string[]).includes(name)
      ) {
        throw new BadRequestException('Cannot rename to a system role name');
      }
      data.name = name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.permissionActions) {
      const perms = await this.resolvePermissions(dto.permissionActions);
      data.permissions = { set: perms.map((p) => ({ id: p.id })) };
    }

    const updated = await this.db.role.update({
      where: { id: role.id },
      data,
      include: {
        permissions: { select: { id: true, action: true } },
        _count: { select: { users: true } },
      },
    });
    return this.mapRole(updated);
  }

  async remove(companyId: string, roleId: string) {
    const role = await this.findRoleOrThrow(companyId, roleId);
    if ((SYSTEM_ROLE_NAMES as readonly string[]).includes(role.name)) {
      throw new ForbiddenException('Cannot delete system roles');
    }
    const employeeRole = await this.db.role.findUnique({
      where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
    });
    if (!employeeRole) {
      throw new BadRequestException('Employee role is missing');
    }
    await this.db.$transaction([
      this.db.user.updateMany({
        where: { companyId, roleId: role.id },
        data: { roleId: employeeRole.id },
      }),
      this.db.role.delete({ where: { id: role.id } }),
    ]);
    return { success: true };
  }

  async unassignUsers(
    companyId: string,
    roleId: string,
    dto: UnassignUsersDto,
    actor: AuthenticatedUser,
  ) {
    const role = await this.findRoleOrThrow(companyId, roleId);
    const employeeRole = await this.db.role.findUnique({
      where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
    });
    if (!employeeRole) {
      throw new BadRequestException('Employee role is missing');
    }
    if (role.id === employeeRole.id) {
      throw new BadRequestException('Users already have the Employee role');
    }

    if (role.name === COMPANY_OWNER_ROLE) {
      const ownerCount = await this.db.user.count({
        where: { companyId, role: { name: COMPANY_OWNER_ROLE } },
      });
      const removing = dto.userIds.length;
      if (ownerCount - removing < 1) {
        throw new BadRequestException('Cannot demote the last Company Owner');
      }
      if (dto.userIds.includes(actor.userId)) {
        throw new BadRequestException('Cannot change your own Owner role');
      }
    }

    await this.db.user.updateMany({
      where: { companyId, roleId: role.id, id: { in: dto.userIds } },
      data: { roleId: employeeRole.id },
    });
    return { success: true };
  }

  async assignUserRole(
    companyId: string,
    userId: string,
    dto: AssignUserRoleDto,
    actor: AuthenticatedUser,
  ) {
    const user = await this.db.user.findFirst({
      where: { id: userId, companyId },
      include: { role: { select: { name: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.findRoleOrThrow(companyId, dto.roleId);

    if (
      user.role.name === COMPANY_OWNER_ROLE &&
      role.name !== COMPANY_OWNER_ROLE
    ) {
      const ownerCount = await this.db.user.count({
        where: {
          companyId,
          role: { name: COMPANY_OWNER_ROLE },
        },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the last Company Owner');
      }
    }

    if (user.id === actor.userId && role.name !== COMPANY_OWNER_ROLE) {
      if (user.role.name === COMPANY_OWNER_ROLE) {
        throw new BadRequestException('Cannot change your own Owner role');
      }
    }

    return this.db.user.update({
      where: { id: user.id },
      data: { roleId: role.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        roleId: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async listUsers(companyId: string) {
    return this.db.user.findMany({
      where: { companyId },
      orderBy: { email: 'asc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPortalUser: true,
        roleId: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  private mapRole(r: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions: { id: string; action: string }[];
    _count: { users: number };
  }) {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
      isSystem: (SYSTEM_ROLE_NAMES as readonly string[]).includes(r.name),
      isLocked: LOCKED_NAMES.has(r.name),
      userCount: r._count.users,
      permissions: r.permissions,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private async findRoleOrThrow(companyId: string, roleId: string) {
    const role = await this.db.role.findFirst({
      where: { id: roleId, companyId },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private async resolvePermissions(actions: string[]) {
    if (actions.length === 0) return [];
    const perms = await this.db.permission.findMany({
      where: { action: { in: actions } },
    });
    if (perms.length !== new Set(actions).size) {
      throw new BadRequestException('One or more permission actions are invalid');
    }
    return perms;
  }
}
