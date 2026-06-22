import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { HashingService } from '../../../core/hashing/hashing.service';
import { DatabaseService } from '../../../database/database.service';
declare const RefreshTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    private readonly db;
    private readonly hashingService;
    constructor(db: DatabaseService, hashingService: HashingService);
    validate(req: Request, payload: {
        sub: string;
    }): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isEmailVerified: boolean;
        isBlocked: boolean;
        provider: import("@prisma/client").$Enums.AuthProvider;
        googleId: string | null;
        twoFactorSecret: string | null;
        isTwoFactorEnabled: boolean;
        twoFaFailedAttempts: number;
        twoFaLockedUntil: Date | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        refreshTokenHash: string | null;
        emailOtp: string | null;
        emailOtpExpiry: Date | null;
        fcmTokens: string[];
        currency: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
