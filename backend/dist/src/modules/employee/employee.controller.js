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
exports.EmployeeController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employee_service_1 = require("./employee.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const query_employees_dto_1 = require("./dto/query-employees.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
let EmployeeController = class EmployeeController {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    create(companyId, dto) {
        return this.employeeService.create(companyId, dto);
    }
    findAll(companyId, query) {
        return this.employeeService.findAll(companyId, query);
    }
    findOne(companyId, id) {
        return this.employeeService.findOne(companyId, id);
    }
    update(companyId, id, dto) {
        return this.employeeService.update(companyId, id, dto);
    }
};
exports.EmployeeController = EmployeeController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    (0, swagger_1.ApiBody)({
        type: create_employee_dto_1.CreateEmployeeDto,
        examples: {
            monthly: {
                summary: 'Monthly salary',
                value: {
                    name: 'Ahmed Ali',
                    email: 'ahmed@acme.com',
                    basicSalary: 5000,
                    employmentType: 'PERMANENT',
                    salaryBasis: 'MONTHLY',
                    isGosiRegistered: false,
                },
            },
            daily: {
                summary: 'Daily wage (SAR per PRESENT day)',
                value: {
                    name: 'Yousef Daily',
                    email: 'yousef.daily@acme.com',
                    basicSalary: 200,
                    employmentType: 'TEMPORARY',
                    salaryBasis: 'DAILY',
                    isGosiRegistered: false,
                },
            },
            hourly: {
                summary: 'Hourly wage (SAR per regular hour)',
                value: {
                    name: 'Maha Hourly',
                    email: 'maha.hourly@acme.com',
                    basicSalary: 25,
                    employmentType: 'CONTRACT',
                    salaryBasis: 'HOURLY',
                    isGosiRegistered: false,
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_employees_dto_1.QueryEmployeesDto]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    (0, swagger_1.ApiBody)({
        type: update_employee_dto_1.UpdateEmployeeDto,
        examples: {
            default: { summary: 'Update', value: { basicSalary: 6000, isActive: true } },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "update", null);
exports.EmployeeController = EmployeeController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], EmployeeController);
//# sourceMappingURL=employee.controller.js.map