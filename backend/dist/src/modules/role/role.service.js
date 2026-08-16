"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const LOCKED_NAMES = new Set([roles_constant_1.COMPANY_OWNER_ROLE, roles_constant_1.EMPLOYEE_ROLE]);
function employeeCodeFromId(id) {
    const hex = id.replace(/-/g, '').slice(-4);
    const n = (parseInt(hex, 16) % 9000) + 1000;
    return `EMP-${n}`;
}
let RoleService = class RoleService {
    db;
    constructor(db) {
        this.db = db;
    }
    listPermissions() {
        return this.db.permission.findMany({
            orderBy: { action: 'asc' },
            select: { id: true, action: true },
        });
    }
    async listRoles(companyId) {
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
    async findOne(companyId, roleId) {
        const role = await this.db.role.findFirst({
            where: { id: roleId, companyId },
            include: {
                permissions: { select: { id: true, action: true } },
                _count: { select: { users: true } },
            },
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return this.mapRole(role);
    }
    async listRoleUsers(companyId, roleId) {
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
    async create(companyId, dto) {
        const name = dto.name.trim();
        if (permissions_constant_1.SYSTEM_ROLE_NAMES.includes(name)) {
            throw new common_1.BadRequestException('Cannot create a role with a system name');
        }
        const existing = await this.db.role.findUnique({
            where: { companyId_name: { companyId, name } },
        });
        if (existing) {
            throw new common_1.BadRequestException('Role name already exists');
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
    async update(companyId, roleId, dto) {
        const role = await this.findRoleOrThrow(companyId, roleId);
        if (LOCKED_NAMES.has(role.name) && dto.name && dto.name.trim() !== role.name) {
            throw new common_1.ForbiddenException('Cannot rename system Owner/Employee roles');
        }
        if (role.name === roles_constant_1.COMPANY_OWNER_ROLE && dto.permissionActions) {
            throw new common_1.ForbiddenException('Cannot change Company Owner permissions');
        }
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (name !== role.name &&
                permissions_constant_1.SYSTEM_ROLE_NAMES.includes(name)) {
                throw new common_1.BadRequestException('Cannot rename to a system role name');
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
    async remove(companyId, roleId) {
        const role = await this.findRoleOrThrow(companyId, roleId);
        if (permissions_constant_1.SYSTEM_ROLE_NAMES.includes(role.name)) {
            throw new common_1.ForbiddenException('Cannot delete system roles');
        }
        const employeeRole = await this.db.role.findUnique({
            where: { companyId_name: { companyId, name: roles_constant_1.EMPLOYEE_ROLE } },
        });
        if (!employeeRole) {
            throw new common_1.BadRequestException('Employee role is missing');
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
    async unassignUsers(companyId, roleId, dto, actor) {
        const role = await this.findRoleOrThrow(companyId, roleId);
        const employeeRole = await this.db.role.findUnique({
            where: { companyId_name: { companyId, name: roles_constant_1.EMPLOYEE_ROLE } },
        });
        if (!employeeRole) {
            throw new common_1.BadRequestException('Employee role is missing');
        }
        if (role.id === employeeRole.id) {
            throw new common_1.BadRequestException('Users already have the Employee role');
        }
        if (role.name === roles_constant_1.COMPANY_OWNER_ROLE) {
            const ownerCount = await this.db.user.count({
                where: { companyId, role: { name: roles_constant_1.COMPANY_OWNER_ROLE } },
            });
            const removing = dto.userIds.length;
            if (ownerCount - removing < 1) {
                throw new common_1.BadRequestException('Cannot demote the last Company Owner');
            }
            if (dto.userIds.includes(actor.userId)) {
                throw new common_1.BadRequestException('Cannot change your own Owner role');
            }
        }
        await this.db.user.updateMany({
            where: { companyId, roleId: role.id, id: { in: dto.userIds } },
            data: { roleId: employeeRole.id },
        });
        return { success: true };
    }
    async assignUserRole(companyId, userId, dto, actor) {
        const user = await this.db.user.findFirst({
            where: { id: userId, companyId },
            include: { role: { select: { name: true } } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const role = await this.findRoleOrThrow(companyId, dto.roleId);
        if (user.role.name === roles_constant_1.COMPANY_OWNER_ROLE &&
            role.name !== roles_constant_1.COMPANY_OWNER_ROLE) {
            const ownerCount = await this.db.user.count({
                where: {
                    companyId,
                    role: { name: roles_constant_1.COMPANY_OWNER_ROLE },
                },
            });
            if (ownerCount <= 1) {
                throw new common_1.BadRequestException('Cannot demote the last Company Owner');
            }
        }
        if (user.id === actor.userId && role.name !== roles_constant_1.COMPANY_OWNER_ROLE) {
            if (user.role.name === roles_constant_1.COMPANY_OWNER_ROLE) {
                throw new common_1.BadRequestException('Cannot change your own Owner role');
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
    async listUsers(companyId) {
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
    mapRole(r) {
        return {
            id: r.id,
            name: r.name,
            description: r.description,
            isActive: r.isActive,
            isSystem: permissions_constant_1.SYSTEM_ROLE_NAMES.includes(r.name),
            isLocked: LOCKED_NAMES.has(r.name),
            userCount: r._count.users,
            permissions: r.permissions,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        };
    }
    async findRoleOrThrow(companyId, roleId) {
        const role = await this.db.role.findFirst({
            where: { id: roleId, companyId },
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async resolvePermissions(actions) {
        if (actions.length === 0)
            return [];
        const perms = await this.db.permission.findMany({
            where: { action: { in: actions } },
        });
        if (perms.length !== new Set(actions).size) {
            throw new common_1.BadRequestException('One or more permission actions are invalid');
        }
        return perms;
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RoleService);
//# sourceMappingURL=role.service.js.map