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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const database_service_1 = require("../../database/database.service");
const hashing_service_1 = require("../../core/hashing/hashing.service");
const redis_module_1 = require("../../core/redis/redis.module");
const ioredis_1 = __importDefault(require("ioredis"));
const OTPAuth = __importStar(require("otpauth"));
const qrcode = __importStar(require("qrcode"));
let AuthService = class AuthService {
    db;
    hashingService;
    jwtService;
    redis;
    constructor(db, hashingService, jwtService, redis) {
        this.db = db;
        this.hashingService = hashingService;
        this.jwtService = jwtService;
        this.redis = redis;
    }
    async generateTokens(user) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role }, {
                secret: process.env.JWT_SECRET,
                expiresIn: (process.env.JWT_EXPIRY || '15m'),
            }),
            this.jwtService.signAsync({ sub: user.id }, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: (process.env.JWT_REFRESH_EXPIRY || '30d'),
            }),
        ]);
        await this.db.user.update({
            where: { id: user.id },
            data: { refreshTokenHash: await this.hashingService.hash(refreshToken) },
        });
        return { accessToken, refreshToken };
    }
    setRefreshTokenCookie(res, refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
    }
    async handleFailedLogin(user) {
        const attempts = user.failedLoginAttempts + 1;
        const locked = attempts >= 5;
        const lockedUntil = locked
            ? new Date(Date.now() + 15 * 60 * 1000)
            : undefined;
        await this.db.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: attempts,
                lockedUntil,
            },
        });
        if (locked) {
            throw new common_1.ForbiddenException({
                message: 'Too many failed attempts',
                errorCode: 'ACCOUNT_LOCKED',
                lockoutUntil: lockedUntil,
            });
        }
    }
    async generate2FA(userId) {
        const secret = new OTPAuth.Secret();
        const totp = new OTPAuth.TOTP({
            issuer: 'YourApp',
            label: userId,
            secret,
        });
        await this.db.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });
        return {
            secret: secret.base32,
            qrCode: await qrcode.toDataURL(totp.toString()),
        };
    }
    async validate2FA(userId, code) {
        const user = await this.db.user.findUnique({ where: { id: userId } });
        if (!user?.twoFactorSecret) {
            return false;
        }
        const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
        });
        return totp.validate({ token: code, window: 1 }) !== null;
    }
    async exchangeGoogleCode(code) {
        const data = await this.redis.get(`google:code:${code}`);
        if (!data) {
            throw new common_1.UnauthorizedException('Invalid or expired code');
        }
        await this.redis.del(`google:code:${code}`);
        return JSON.parse(data);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        hashing_service_1.HashingService,
        jwt_1.JwtService,
        ioredis_1.default])
], AuthService);
//# sourceMappingURL=auth.service.js.map