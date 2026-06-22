import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import Redis from 'ioredis';
import { User } from '@prisma/client';
export declare class AuthService {
    private readonly db;
    private readonly hashingService;
    private readonly jwtService;
    private readonly redis;
    constructor(db: DatabaseService, hashingService: HashingService, jwtService: JwtService, redis: Redis);
    generateTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    setRefreshTokenCookie(res: Response, refreshToken: string): void;
    handleFailedLogin(user: User): Promise<void>;
    generate2FA(userId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    validate2FA(userId: string, code: string): Promise<boolean>;
    exchangeGoogleCode(code: string): Promise<any>;
}
