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
exports.CompanyController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const company_service_1 = require("./company.service");
const update_policy_dto_1 = require("./dto/update-policy.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let CompanyController = class CompanyController {
    companyService;
    constructor(companyService) {
        this.companyService = companyService;
    }
    getCompany(companyId) {
        return this.companyService.getCompany(companyId);
    }
    updateCompany(companyId, dto) {
        return this.companyService.updateCompany(companyId, dto);
    }
    getPolicy(companyId) {
        return this.companyService.getPolicy(companyId);
    }
    updatePolicy(companyId, dto) {
        return this.companyService.updatePolicy(companyId, dto);
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getCompany", null);
__decorate([
    (0, common_1.Patch)(),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_COMPANY_POLICY),
    (0, swagger_1.ApiBody)({ type: update_company_dto_1.UpdateCompanyDto }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Get)('policy'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Patch)('policy'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_COMPANY_POLICY),
    (0, swagger_1.ApiBody)({
        type: update_policy_dto_1.UpdatePolicyDto,
        examples: {
            default: {
                summary: 'Update company policy',
                value: {
                    delayDeductionType: 'PER_MINUTE',
                    defaultWeekendDays: ['FRIDAY', 'SATURDAY'],
                    currency: 'SAR',
                    payrollCycle: 'MONTHLY',
                    payrollPayoutDay: 27,
                    directBankTransfer: true,
                    medicalInsuranceProvider: 'bupa',
                    medicalInsuranceTier: 'B',
                    gosiAutoEnroll: true,
                    benefitHousingAllowance: false,
                    benefitTransportAllowance: true,
                    benefitAnnualTickets: true,
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_policy_dto_1.UpdatePolicyDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "updatePolicy", null);
exports.CompanyController = CompanyController = __decorate([
    (0, swagger_1.ApiTags)('Company'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('company'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [company_service_1.CompanyService])
], CompanyController);
//# sourceMappingURL=company.controller.js.map