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
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const employee_service_1 = require("./employee.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const query_employees_dto_1 = require("./dto/query-employees.dto");
const bulk_delete_employees_dto_1 = require("./dto/bulk-delete-employees.dto");
const query_employee_attendance_dto_1 = require("./dto/query-employee-attendance.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let EmployeeController = class EmployeeController {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    create(companyId, dto) {
        return this.employeeService.create(companyId, dto);
    }
    importCsv(companyId, file) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.employeeService.importFromCsv(companyId, file);
    }
    bulkDelete(companyId, dto) {
        return this.employeeService.bulkRemove(companyId, dto.ids);
    }
    findAll(companyId, query) {
        return this.employeeService.findAll(companyId, query);
    }
    listDepartments(companyId) {
        return this.employeeService.listDepartments(companyId);
    }
    listPayrollSlips(companyId, id) {
        return this.employeeService.listPayrollSlips(companyId, id);
    }
    listLeaves(companyId, id) {
        return this.employeeService.listLeaves(companyId, id);
    }
    listAttendance(companyId, id, query) {
        return this.employeeService.listAttendance(companyId, id, {
            page: query.page,
            limit: query.limit,
            skip: query.skip,
            from: query.from,
            to: query.to,
            prismaOrder: query.prismaOrder,
        });
    }
    findOne(companyId, id) {
        return this.employeeService.findOne(companyId, id);
    }
    update(companyId, id, dto) {
        return this.employeeService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.employeeService.remove(companyId, id);
    }
};
exports.EmployeeController = EmployeeController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.CREATE_EMPLOYEE),
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
    (0, common_1.Post)('import'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.CREATE_EMPLOYEE),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file'],
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Post)('bulk-delete'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.UPDATE_EMPLOYEE),
    (0, swagger_1.ApiBody)({ type: bulk_delete_employees_dto_1.BulkDeleteEmployeesDto }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bulk_delete_employees_dto_1.BulkDeleteEmployeesDto]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "bulkDelete", null);
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
    (0, common_1.Get)('departments'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "listDepartments", null);
__decorate([
    (0, common_1.Get)(':id/payroll-slips'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "listPayrollSlips", null);
__decorate([
    (0, common_1.Get)(':id/leaves'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "listLeaves", null);
__decorate([
    (0, common_1.Get)(':id/attendance'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, query_employee_attendance_dto_1.QueryEmployeeAttendanceDto]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "listAttendance", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.UPDATE_EMPLOYEE),
    (0, swagger_1.ApiBody)({
        type: update_employee_dto_1.UpdateEmployeeDto,
        examples: {
            default: {
                summary: 'Update',
                value: { basicSalary: 6000, isActive: true },
            },
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
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.UPDATE_EMPLOYEE),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeeController.prototype, "remove", null);
exports.EmployeeController = EmployeeController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], EmployeeController);
//# sourceMappingURL=employee.controller.js.map