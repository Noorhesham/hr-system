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
exports.LoanController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const loan_service_1 = require("./loan.service");
const create_loan_dto_1 = require("./dto/create-loan.dto");
const approve_loan_dto_1 = require("./dto/approve-loan.dto");
const query_loans_dto_1 = require("./dto/query-loans.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
let LoanController = class LoanController {
    loanService;
    constructor(loanService) {
        this.loanService = loanService;
    }
    create(companyId, employeeId, dto) {
        return this.loanService.create(companyId, employeeId, dto);
    }
    findAllForEmployee(companyId, employeeId) {
        return this.loanService.findAllForEmployee(companyId, employeeId);
    }
    findAll(companyId, query) {
        return this.loanService.findAll(companyId, query);
    }
    findOne(companyId, id) {
        return this.loanService.findOne(companyId, id);
    }
    approve(companyId, id, dto) {
        return this.loanService.approve(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.loanService.remove(companyId, id);
    }
};
exports.LoanController = LoanController;
__decorate([
    (0, common_1.Post)('employees/:employeeId/loans'),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    (0, swagger_1.ApiBody)({
        type: create_loan_dto_1.CreateLoanDto,
        examples: {
            default: { summary: 'New loan', value: { totalAmount: 12000 } },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_loan_dto_1.CreateLoanDto]),
    __metadata("design:returntype", void 0)
], LoanController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('employees/:employeeId/loans'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoanController.prototype, "findAllForEmployee", null);
__decorate([
    (0, common_1.Get)('loans'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_loans_dto_1.QueryLoansDto]),
    __metadata("design:returntype", void 0)
], LoanController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('loans/:id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoanController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('loans/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    (0, swagger_1.ApiBody)({
        type: approve_loan_dto_1.ApproveLoanDto,
        examples: {
            byCount: {
                summary: 'Split into 6 equal installments',
                value: { numberOfInstallments: 6, startDate: '2026-08-01' },
            },
            byAmount: {
                summary: 'Fixed 2000/month (last absorbs remainder)',
                value: { installmentAmount: 2000, startDate: '2026-08-01' },
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, approve_loan_dto_1.ApproveLoanDto]),
    __metadata("design:returntype", void 0)
], LoanController.prototype, "approve", null);
__decorate([
    (0, common_1.Delete)('loans/:id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoanController.prototype, "remove", null);
exports.LoanController = LoanController = __decorate([
    (0, swagger_1.ApiTags)('Loans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [loan_service_1.LoanService])
], LoanController);
//# sourceMappingURL=loan.controller.js.map