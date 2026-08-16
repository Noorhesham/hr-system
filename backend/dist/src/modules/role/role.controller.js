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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const role_service_1 = require("./role.service");
const role_dto_1 = require("./dto/role.dto");
let RoleController = class RoleController {
    roles;
    constructor(roles) {
        this.roles = roles;
    }
    listPermissions() {
        return this.roles.listPermissions();
    }
    listRoles(companyId) {
        return this.roles.listRoles(companyId);
    }
    listUsers(companyId) {
        return this.roles.listUsers(companyId);
    }
    listRoleUsers(companyId, id) {
        return this.roles.listRoleUsers(companyId, id);
    }
    findOne(companyId, id) {
        return this.roles.findOne(companyId, id);
    }
    create(companyId, dto) {
        return this.roles.create(companyId, dto);
    }
    update(companyId, id, dto) {
        return this.roles.update(companyId, id, dto);
    }
    unassignUsers(companyId, id, dto, actor) {
        return this.roles.unassignUsers(companyId, id, dto, actor);
    }
    remove(companyId, id) {
        return this.roles.remove(companyId, id);
    }
    assignUserRole(companyId, userId, dto, actor) {
        return this.roles.assignUserRole(companyId, userId, dto, actor);
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, common_1.Get)('permissions'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.VIEW_ROLES, permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.VIEW_ROLES, permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('roles/users'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('roles/:id/users'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.VIEW_ROLES, permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "listRoleUsers", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.VIEW_ROLES, permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('roles/:id/users/unassign'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, role_dto_1.UnassignUsersDto, Object]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "unassignUsers", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('users/:userId/role'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ROLES),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, role_dto_1.AssignUserRoleDto, Object]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "assignUserRole", null);
exports.RoleController = RoleController = __decorate([
    (0, swagger_1.ApiTags)('Roles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [role_service_1.RoleService])
], RoleController);
//# sourceMappingURL=role.controller.js.map