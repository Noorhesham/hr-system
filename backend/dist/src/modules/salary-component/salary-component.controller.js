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
exports.SalaryComponentController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const salary_component_service_1 = require("./salary-component.service");
const create_salary_component_dto_1 = require("./dto/create-salary-component.dto");
const update_salary_component_dto_1 = require("./dto/update-salary-component.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let SalaryComponentController = class SalaryComponentController {
    salaryComponentService;
    constructor(salaryComponentService) {
        this.salaryComponentService = salaryComponentService;
    }
    create(companyId, employeeId, dto) {
        return this.salaryComponentService.create(companyId, employeeId, dto);
    }
    findAll(companyId, employeeId) {
        return this.salaryComponentService.findAllForEmployee(companyId, employeeId);
    }
    update(companyId, id, dto) {
        return this.salaryComponentService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.salaryComponentService.remove(companyId, id);
    }
};
exports.SalaryComponentController = SalaryComponentController;
__decorate([
    (0, common_1.Post)('employees/:employeeId/salary-components'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.UPDATE_EMPLOYEE),
    (0, swagger_1.ApiBody)({
        type: create_salary_component_dto_1.CreateSalaryComponentDto,
        examples: {
            allowance: {
                summary: 'Fixed housing allowance',
                value: { type: 'ALLOWANCE', name: 'Housing', amount: 1000, isPercentage: false },
            },
            percentage: {
                summary: 'Percentage-based allowance',
                value: { type: 'ALLOWANCE', name: 'Transport', amount: 10, isPercentage: true },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_salary_component_dto_1.CreateSalaryComponentDto]),
    __metadata("design:returntype", void 0)
], SalaryComponentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('employees/:employeeId/salary-components'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalaryComponentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('salary-components/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.UPDATE_EMPLOYEE),
    (0, swagger_1.ApiBody)({
        type: update_salary_component_dto_1.UpdateSalaryComponentDto,
        examples: {
            default: { summary: 'Update amount', value: { amount: 1500 } },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_salary_component_dto_1.UpdateSalaryComponentDto]),
    __metadata("design:returntype", void 0)
], SalaryComponentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('salary-components/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.UPDATE_EMPLOYEE),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalaryComponentController.prototype, "remove", null);
exports.SalaryComponentController = SalaryComponentController = __decorate([
    (0, swagger_1.ApiTags)('Salary Components'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [salary_component_service_1.SalaryComponentService])
], SalaryComponentController);
//# sourceMappingURL=salary-component.controller.js.map