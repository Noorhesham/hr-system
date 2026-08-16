"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const database_service_1 = require("../../database/database.service");
const hashing_service_1 = require("../../core/hashing/hashing.service");
const user_service_1 = require("../user/user.service");
const platform_settings_service_1 = require("../platform/platform-settings.service");
const system_roles_util_1 = require("../../common/utils/system-roles.util");
const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/';
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY = '15m';
const RESET_PURPOSE = 'password-reset';
let AuthService = AuthService_1 = class AuthService {
    db;
    hashing;
    jwt;
    users;
    platform;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(db, hashing, jwt, users, platform) {
        this.db = db;
        this.hashing = hashing;
        this.jwt = jwt;
        this.users = users;
        this.platform = platform;
    }
    async register(dto) {
        const existing = await this.users.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const planId = await this.resolvePlanId(dto.planId);
        const passwordHash = await this.hashing.hash(dto.password);
        const { trialDays } = await this.platform.getSettings();
        const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        const user = await this.db.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: dto.companyName,
                    establishmentNumber: dto.establishmentNumber,
                    subscriptionStatus: client_1.SubscriptionStatus.TRIAL,
                    trialEndsAt,
                    ...(planId ? { planId } : {}),
                },
            });
            await tx.companyPolicy.create({ data: { companyId: company.id } });
            const { ownerRoleId } = await (0, system_roles_util_1.provisionSystemRoles)(tx, company.id);
            return tx.user.create({
                data: {
                    email: dto.email.trim().toLowerCase(),
                    password: passwordHash,
                    fullName: dto.fullName,
                    phone: dto.phone,
                    jobTitle: dto.jobTitle,
                    companyId: company.id,
                    roleId: ownerRoleId,
                    isPortalUser: false,
                    onboardingStep: client_1.OnboardingStep.PRICING,
                },
            });
        });
        const dbUser = await this.users.findById(user.id);
        if (!dbUser) {
            throw new common_1.UnauthorizedException('User not found after registration');
        }
        return this.issueTokens(this.toAuthUser(dbUser));
    }
    async login(dto) {
        const user = await this.users.findByEmail(dto.email.trim().toLowerCase());
        if (!user || !(await this.hashing.compare(dto.password, user.password))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return this.issueTokens(this.toAuthUser(user));
    }
    async forgotPassword(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.db.user.findUnique({
            where: { email },
            select: { id: true, email: true },
        });
        const generic = {
            success: true,
            message: 'If an account exists for this email, a verification code has been sent',
        };
        if (!user) {
            await this.hashing.hash('000000');
            return generic;
        }
        const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
        await this.db.user.update({
            where: { id: user.id },
            data: {
                passwordResetOtpHash: await this.hashing.hash(otp),
                passwordResetOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
            },
        });
        this.logger.log(`Password reset OTP for ${user.email}: ${otp} (expires in 10m)`);
        if (process.env.NODE_ENV === 'production') {
            return generic;
        }
        return { ...generic, devOtp: otp };
    }
    async verifyResetOtp(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.db.user.findUnique({
            where: { email },
            select: {
                id: true,
                passwordResetOtpHash: true,
                passwordResetOtpExpiresAt: true,
            },
        });
        if (!user?.passwordResetOtpHash ||
            !user.passwordResetOtpExpiresAt ||
            user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Invalid or expired verification code');
        }
        const ok = await this.hashing.compare(dto.code, user.passwordResetOtpHash);
        if (!ok) {
            throw new common_1.BadRequestException('Invalid or expired verification code');
        }
        await this.db.user.update({
            where: { id: user.id },
            data: {
                passwordResetOtpHash: null,
                passwordResetOtpExpiresAt: null,
            },
        });
        const resetToken = await this.jwt.signAsync({ sub: user.id, purpose: RESET_PURPOSE }, {
            secret: process.env.JWT_SECRET,
            expiresIn: RESET_TOKEN_EXPIRY,
        });
        return { resetToken };
    }
    async resetPassword(dto) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(dto.resetToken, {
                secret: process.env.JWT_SECRET,
            });
        }
        catch {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        if (payload.purpose !== RESET_PURPOSE || !payload.sub) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const user = await this.db.user.findUnique({
            where: { id: payload.sub },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        await this.db.user.update({
            where: { id: user.id },
            data: {
                password: await this.hashing.hash(dto.newPassword),
                refreshTokenHash: null,
                passwordResetOtpHash: null,
                passwordResetOtpExpiresAt: null,
            },
        });
        return { success: true };
    }
    async refreshTokens(user) {
        const dbUser = await this.users.findById(user.userId);
        if (!dbUser) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.issueTokens(this.toAuthUser(dbUser));
    }
    async getMe(userId) {
        const dbUser = await this.users.findById(userId);
        if (!dbUser) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.toAuthUser(dbUser);
    }
    async updateProfile(user, dto) {
        const updated = await this.db.user.update({
            where: { id: user.userId },
            data: {
                ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
                ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
                ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
            },
            include: {
                role: {
                    select: {
                        name: true,
                        permissions: { select: { action: true } },
                    },
                },
                employee: { select: { id: true } },
                company: { select: { planId: true, subscriptionStatus: true } },
            },
        });
        return this.toAuthUser(updated);
    }
    async logout(userId) {
        await this.db.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
    }
    async changePassword(user, dto) {
        const dbUser = await this.users.findById(user.userId);
        if (!dbUser) {
            throw new common_1.UnauthorizedException();
        }
        const valid = await this.hashing.compare(dto.currentPassword, dbUser.password);
        if (!valid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        if (dto.currentPassword === dto.newPassword) {
            throw new common_1.BadRequestException('New password must be different from the current one');
        }
        await this.db.user.update({
            where: { id: user.userId },
            data: { password: await this.hashing.hash(dto.newPassword) },
        });
        return this.issueTokens(user);
    }
    setRefreshTokenCookie(res, refreshToken) {
        res.cookie(REFRESH_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFRESH_MAX_AGE_MS,
            path: REFRESH_COOKIE_PATH,
        });
    }
    clearRefreshTokenCookie(res) {
        res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    }
    async issueTokens(user) {
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user),
            this.signRefreshToken(user.userId),
        ]);
        await this.db.user.update({
            where: { id: user.userId },
            data: { refreshTokenHash: await this.hashing.hash(refreshToken) },
        });
        return { accessToken, refreshToken, user };
    }
    toAuthUser(user) {
        const permissions = (user.role.permissions ?? []).map((p) => p.action);
        return {
            userId: user.id,
            email: user.email,
            companyId: user.companyId,
            roleId: user.roleId,
            roleName: user.role.name,
            permissions,
            isPlatformAdmin: user.isPlatformAdmin,
            isPortalUser: user.isPortalUser,
            employeeId: user.employee?.id ?? null,
            onboardingStep: user.onboardingStep ?? null,
            onboardingCompletedAt: user.onboardingCompletedAt
                ? user.onboardingCompletedAt.toISOString()
                : null,
            fullName: user.fullName ?? null,
            phone: user.phone ?? null,
            jobTitle: user.jobTitle ?? null,
            planId: user.company?.planId ?? null,
            subscriptionStatus: user.company?.subscriptionStatus ?? null,
        };
    }
    signAccessToken(user) {
        const payload = {
            sub: user.userId,
            email: user.email,
            companyId: user.companyId,
            roleId: user.roleId,
            roleName: user.roleName,
            permissions: user.permissions,
            isPlatformAdmin: user.isPlatformAdmin,
            isPortalUser: user.isPortalUser,
            employeeId: user.employeeId,
            onboardingStep: user.onboardingStep,
            onboardingCompletedAt: user.onboardingCompletedAt,
            planId: user.planId,
            subscriptionStatus: user.subscriptionStatus,
        };
        return this.jwt.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: (process.env.JWT_EXPIRY || '15m'),
        });
    }
    signRefreshToken(userId) {
        return this.jwt.signAsync({ sub: userId }, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: (process.env.JWT_REFRESH_EXPIRY || '30d'),
        });
    }
    async resolvePlanId(requestedId) {
        if (!requestedId) {
            return null;
        }
        const plan = await this.db.subscriptionPlan.findUnique({
            where: { id: requestedId },
            select: { id: true },
        });
        if (!plan) {
            throw new common_1.BadRequestException('The selected subscription plan does not exist');
        }
        return plan.id;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        hashing_service_1.HashingService,
        jwt_1.JwtService,
        user_service_1.UserService,
        platform_settings_service_1.PlatformSettingsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map