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
exports.PayrollController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("./payroll.service");
const create_payroll_cycle_dto_1 = require("./dto/create-payroll-cycle.dto");
const query_payroll_cycles_dto_1 = require("./dto/query-payroll-cycles.dto");
const query_payroll_slips_dto_1 = require("./dto/query-payroll-slips.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let PayrollController = class PayrollController {
    payrollService;
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    create(companyId, dto) {
        return this.payrollService.createCycle(companyId, dto);
    }
    findAll(companyId, query) {
        return this.payrollService.findAll(companyId, query);
    }
    listSlips(companyId, id, query) {
        return this.payrollService.listSlips(companyId, id, query);
    }
    findOne(companyId, id) {
        return this.payrollService.findOne(companyId, id);
    }
    findSlip(companyId, slipId) {
        return this.payrollService.findSlip(companyId, slipId);
    }
    recalculate(companyId, id) {
        return this.payrollService.recalculate(companyId, id);
    }
    revertToDraft(companyId, id) {
        return this.payrollService.revertToDraft(companyId, id);
    }
    review(companyId, id) {
        return this.payrollService.moveToReview(companyId, id);
    }
    approve(companyId, id) {
        return this.payrollService.approve(companyId, id);
    }
    close(companyId, id) {
        return this.payrollService.close(companyId, id);
    }
    async exportWps(companyId, id, res) {
        const file = await this.payrollService.exportWps(companyId, id);
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.setHeader('Content-Type', file.contentType);
        res.send(file.body);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Post)('cycles'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    (0, swagger_1.ApiBody)({
        type: create_payroll_cycle_dto_1.CreatePayrollCycleDto,
        examples: {
            default: {
                summary: 'July 2026 payroll',
                value: { month: 7, year: 2026 },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_payroll_cycle_dto_1.CreatePayrollCycleDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('cycles'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_payroll_cycles_dto_1.QueryPayrollCyclesDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('cycles/:id/slips'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, query_payroll_slips_dto_1.QueryPayrollSlipsDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "listSlips", null);
__decorate([
    (0, common_1.Get)('cycles/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slips/:slipId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('slipId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findSlip", null);
__decorate([
    (0, common_1.Post)('cycles/:id/recalculate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "recalculate", null);
__decorate([
    (0, common_1.Patch)('cycles/:id/draft'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "revertToDraft", null);
__decorate([
    (0, common_1.Patch)('cycles/:id/review'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "review", null);
__decorate([
    (0, common_1.Patch)('cycles/:id/approve'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('cycles/:id/close'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "close", null);
__decorate([
    (0, common_1.Get)('cycles/:id/wps'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_PAYROLL),
    (0, swagger_1.ApiProduces)('text/csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "exportWps", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('Payroll'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map