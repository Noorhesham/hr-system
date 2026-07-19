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
exports.EssController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ess_service_1 = require("./ess.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const page_options_dto_1 = require("../../common/pagination/page-options.dto");
let EssController = class EssController {
    essService;
    constructor(essService) {
        this.essService = essService;
    }
    me(actor) {
        return this.essService.me(actor);
    }
    salaryComponents(actor) {
        return this.essService.mySalaryComponents(actor);
    }
    documents(actor) {
        return this.essService.myDocuments(actor);
    }
    attendance(actor, query) {
        return this.essService.myAttendance(actor, query);
    }
    loans(actor) {
        return this.essService.myLoans(actor);
    }
    payslips(actor, query) {
        return this.essService.myPayslips(actor, query);
    }
    payslip(actor, id) {
        return this.essService.myPayslip(actor, id);
    }
};
exports.EssController = EssController;
__decorate([
    (0, common_1.Get)('me'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('salary-components'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "salaryComponents", null);
__decorate([
    (0, common_1.Get)('documents'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "documents", null);
__decorate([
    (0, common_1.Get)('attendance'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, page_options_dto_1.PageOptionsDto]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "attendance", null);
__decorate([
    (0, common_1.Get)('loans'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "loans", null);
__decorate([
    (0, common_1.Get)('payslips'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, page_options_dto_1.PageOptionsDto]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "payslips", null);
__decorate([
    (0, common_1.Get)('payslips/:id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EssController.prototype, "payslip", null);
exports.EssController = EssController = __decorate([
    (0, swagger_1.ApiTags)('ESS'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ess'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.EMPLOYEE_ROLE),
    __metadata("design:paramtypes", [ess_service_1.EssService])
], EssController);
//# sourceMappingURL=ess.controller.js.map