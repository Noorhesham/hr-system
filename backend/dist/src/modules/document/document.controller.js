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
exports.DocumentController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const document_service_1 = require("./document.service");
const create_document_dto_1 = require("./dto/create-document.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
let DocumentController = class DocumentController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    create(companyId, employeeId, dto) {
        return this.documentService.create(companyId, employeeId, dto);
    }
    findAll(companyId, employeeId) {
        return this.documentService.findAllForEmployee(companyId, employeeId);
    }
    findExpiring(companyId, days) {
        const parsed = Number(days);
        const window = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
        return this.documentService.findExpiring(companyId, window);
    }
    remove(companyId, id) {
        return this.documentService.remove(companyId, id);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Post)('employees/:employeeId/documents'),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    (0, swagger_1.ApiBody)({
        type: create_document_dto_1.CreateDocumentDto,
        examples: {
            default: {
                summary: 'Add document',
                value: {
                    type: 'NATIONAL_ID',
                    expiryDate: '2027-12-31',
                    documentNumber: '1234567890',
                    fileUrl: 'https://files.example.com/id.pdf',
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_document_dto_1.CreateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('employees/:employeeId/documents'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "findAll", null);
__decorate([
    openapi.ApiQuery({ name: "days", required: false }),
    (0, common_1.Get)('documents/expiring'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "findExpiring", null);
__decorate([
    (0, common_1.Delete)('documents/:id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.COMPANY_OWNER_ROLE),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "remove", null);
exports.DocumentController = DocumentController = __decorate([
    (0, swagger_1.ApiTags)('Documents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map