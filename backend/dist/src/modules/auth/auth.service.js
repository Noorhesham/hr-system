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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const hashing_service_1 = require("../../core/hashing/hashing.service");
const user_service_1 = require("../user/user.service");
const platform_settings_service_1 = require("../platform/platform-settings.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/';
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
let AuthService = class AuthService {
    db;
    hashing;
    jwt;
    users;
    platform;
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
            const permissions = await tx.permission.findMany({ select: { id: true } });
            const role = await tx.role.create({
                data: {
                    name: roles_constant_1.COMPANY_OWNER_ROLE,
                    companyId: company.id,
                    permissions: { connect: permissions.map((p) => ({ id: p.id })) },
                },
            });
            return tx.user.create({
                data: {
                    email: dto.email,
                    password: passwordHash,
                    companyId: company.id,
                    roleId: role.id,
                    isPortalUser: false,
                },
            });
        });
        return this.issueTokens(this.toAuthUser(user, roles_constant_1.COMPANY_OWNER_ROLE));
    }
    async login(dto) {
        const user = await this.users.findByEmail(dto.email);
        if (!user || !(await this.hashing.compare(dto.password, user.password))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return this.issueTokens(this.toAuthUser(user, user.role.name));
    }
    refreshTokens(user) {
        return this.issueTokens(user);
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
    toAuthUser(user, roleName) {
        return {
            userId: user.id,
            email: user.email,
            companyId: user.companyId,
            roleId: user.roleId,
            roleName,
            isPlatformAdmin: user.isPlatformAdmin,
            isPortalUser: user.isPortalUser,
            employeeId: user.employee?.id ?? null,
        };
    }
    signAccessToken(user) {
        const payload = {
            sub: user.userId,
            email: user.email,
            companyId: user.companyId,
            roleId: user.roleId,
            roleName: user.roleName,
            isPlatformAdmin: user.isPlatformAdmin,
            isPortalUser: user.isPortalUser,
            employeeId: user.employeeId,
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
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        hashing_service_1.HashingService,
        jwt_1.JwtService,
        user_service_1.UserService,
        platform_settings_service_1.PlatformSettingsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map