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
exports.UploadController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const multer_1 = require("multer");
const upload_service_1 = require("./upload.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
let UploadController = class UploadController {
    uploads;
    constructor(uploads) {
        this.uploads = uploads;
    }
    upload(file) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.uploads.uploadBuffer(file, 'hr-system/onboarding');
    }
    uploadOnboardingLogo(file) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.uploads.uploadBuffer(file, 'hr-system/onboarding/logos');
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_BYTES },
        fileFilter: (_req, file, cb) => {
            const ok = /^image\//.test(file.mimetype) ||
                file.mimetype === 'application/pdf' ||
                file.mimetype === 'text/csv' ||
                file.mimetype === 'application/vnd.ms-excel' ||
                file.mimetype ===
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.originalname.toLowerCase().endsWith('.csv');
            if (!ok) {
                cb(new common_1.BadRequestException('Unsupported file type (images, PDF, CSV/Excel only)'), false);
                return;
            }
            cb(null, true);
        },
    })),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('onboarding-logo'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_LOGO_BYTES },
        fileFilter: (_req, file, cb) => {
            if (!/^image\//.test(file.mimetype)) {
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
                return;
            }
            cb(null, true);
        },
    })),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadOnboardingLogo", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map