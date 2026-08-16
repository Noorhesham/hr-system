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
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const refresh_token_guard_1 = require("./guards/refresh-token.guard");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto, res) {
        const { accessToken, refreshToken, user } = await this.authService.register(dto);
        this.authService.setRefreshTokenCookie(res, refreshToken);
        return { accessToken, user };
    }
    async login(dto, res) {
        const { accessToken, refreshToken, user } = await this.authService.login(dto);
        this.authService.setRefreshTokenCookie(res, refreshToken);
        return { accessToken, user };
    }
    forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    verifyResetOtp(dto) {
        return this.authService.verifyResetOtp(dto);
    }
    resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    async refresh(user, res) {
        const { accessToken, refreshToken } = await this.authService.refreshTokens(user);
        this.authService.setRefreshTokenCookie(res, refreshToken);
        return { accessToken };
    }
    async logout(userId, res) {
        await this.authService.logout(userId);
        this.authService.clearRefreshTokenCookie(res);
        return { success: true };
    }
    async changePassword(user, dto, res) {
        const { accessToken, refreshToken } = await this.authService.changePassword(user, dto);
        this.authService.setRefreshTokenCookie(res, refreshToken);
        return { accessToken };
    }
    updateProfile(user, dto) {
        return this.authService.updateProfile(user, dto);
    }
    me(userId) {
        return this.authService.getMe(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.RegisterDto,
        examples: {
            default: {
                summary: 'New company + admin (no plan → trial)',
                value: {
                    companyName: 'Acme Operations',
                    email: 'admin@acme.com',
                    password: 'Passw0rd!',
                    establishmentNumber: '1-2345678',
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.LoginDto,
        examples: {
            default: {
                summary: 'Login',
                value: { email: 'owner@najd.sa', password: 'Owner@1234' },
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.ForgotPasswordDto,
        examples: {
            default: {
                summary: 'Request OTP',
                value: { email: 'owner@najd.sa' },
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('verify-reset-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.VerifyResetOtpDto,
        examples: {
            default: {
                summary: 'Verify OTP',
                value: { email: 'owner@najd.sa', code: '123456' },
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyResetOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyResetOtp", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.ResetPasswordDto,
        examples: {
            default: {
                summary: 'Reset password',
                value: {
                    resetToken: '<from verify-reset-otp>',
                    newPassword: 'Owner@1234',
                },
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiCookieAuth)(),
    (0, common_1.UseGuards)(refresh_token_guard_1.RefreshTokenGuard),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.ChangePasswordDto,
        examples: {
            default: {
                summary: 'Change password',
                value: { currentPassword: 'Passw0rd!', newPassword: 'NewPassw0rd!' },
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBody)({
        type: auth_dto_1.UpdateProfileDto,
        examples: {
            default: {
                summary: 'Update profile',
                value: {
                    fullName: 'أحمد الحربي',
                    phone: '0501234567',
                    jobTitle: 'مدير الموارد البشرية',
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map