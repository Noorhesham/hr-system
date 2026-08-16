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
exports.ReportsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const query_month_dto_1 = require("./dto/query-month.dto");
const query_dashboard_dto_1 = require("./dto/query-dashboard.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    dashboard(companyId, query) {
        return this.reportsService.dashboard(companyId, query);
    }
    payrollSummary(companyId, q) {
        return this.reportsService.payrollSummary(companyId, q);
    }
    attendanceSummary(companyId, q) {
        return this.reportsService.attendanceSummary(companyId, q);
    }
    gosi(companyId, q) {
        return this.reportsService.gosiSummary(companyId, q);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_dashboard_dto_1.QueryDashboardDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('payroll-summary'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_month_dto_1.QueryMonthDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "payrollSummary", null);
__decorate([
    (0, common_1.Get)('attendance-summary'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_month_dto_1.QueryMonthDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "attendanceSummary", null);
__decorate([
    (0, common_1.Get)('gosi'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_month_dto_1.QueryMonthDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "gosi", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.VIEW_REPORTS),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map