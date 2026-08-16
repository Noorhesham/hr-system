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
exports.LeaveController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const tenant_decorator_2 = require("../tenant/decorators/tenant.decorator");
const leave_service_1 = require("./leave.service");
const create_leave_dto_1 = require("./dto/create-leave.dto");
const query_leaves_dto_1 = require("./dto/query-leaves.dto");
let LeaveController = class LeaveController {
    leaveService;
    constructor(leaveService) {
        this.leaveService = leaveService;
    }
    create(companyId, actor, dto) {
        return this.leaveService.create(companyId, actor, dto);
    }
    findAll(companyId, actor, query) {
        return this.leaveService.findAll(companyId, actor, query);
    }
    findOne(companyId, actor, id) {
        return this.leaveService.findOne(companyId, actor, id);
    }
    approve(companyId, actor, id) {
        return this.leaveService.approve(companyId, actor, id);
    }
    reject(companyId, actor, id, dto) {
        return this.leaveService.reject(companyId, actor, id, dto);
    }
    remove(companyId, actor, id) {
        return this.leaveService.remove(companyId, actor, id);
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBody)({ type: create_leave_dto_1.CreateLeaveDto }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_2.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_leave_dto_1.CreateLeaveDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_2.CurrentUser)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, query_leaves_dto_1.QueryLeavesDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_2.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_2.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBody)({ type: create_leave_dto_1.RejectLeaveDto }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_2.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, create_leave_dto_1.RejectLeaveDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_2.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "remove", null);
exports.LeaveController = LeaveController = __decorate([
    (0, swagger_1.ApiTags)('Leaves'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('leaves'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map