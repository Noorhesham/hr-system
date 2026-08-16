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
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const multer_1 = require("multer");
const document_service_1 = require("./document.service");
const create_document_dto_1 = require("./dto/create-document.dto");
const upload_service_1 = require("../upload/upload.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let DocumentController = class DocumentController {
    documentService;
    uploads;
    constructor(documentService, uploads) {
        this.documentService = documentService;
        this.uploads = uploads;
    }
    create(companyId, employeeId, dto) {
        return this.documentService.create(companyId, employeeId, dto);
    }
    async uploadAndCreate(companyId, employeeId, file, body) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        if (!body.type ||
            !Object.values(client_1.DocumentType).includes(body.type)) {
            throw new common_1.BadRequestException('type must be a valid DocumentType');
        }
        const uploaded = await this.uploads.uploadBuffer(file, 'hr-system/documents');
        return this.documentService.create(companyId, employeeId, {
            type: body.type,
            expiryDate: body.expiryDate,
            documentNumber: body.documentNumber,
            fileUrl: uploaded.url,
        });
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
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_DOCUMENTS),
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
    (0, common_1.Post)('employees/:employeeId/documents/upload'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_DOCUMENTS),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file', 'type'],
            properties: {
                file: { type: 'string', format: 'binary' },
                type: { type: 'string', enum: Object.values(client_1.DocumentType) },
                expiryDate: { type: 'string', example: '2027-12-31' },
                documentNumber: { type: 'string' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 8 * 1024 * 1024 },
    })),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "uploadAndCreate", null);
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
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_DOCUMENTS),
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [document_service_1.DocumentService,
        upload_service_1.UploadService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map