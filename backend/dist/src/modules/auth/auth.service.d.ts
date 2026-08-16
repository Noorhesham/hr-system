import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { UserService } from '../user/user.service';
import { PlatformSettingsService } from '../platform/platform-settings.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto, VerifyResetOtpDto } from './dto/auth.dto';
import { AuthenticatedUser } from './strategies/jwt.strategy';
export declare class AuthService {
    private readonly db;
    private readonly hashing;
    private readonly jwt;
    private readonly users;
    private readonly platform;
    private readonly logger;
    constructor(db: DatabaseService, hashing: HashingService, jwt: JwtService, users: UserService, platform: PlatformSettingsService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: AuthenticatedUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: AuthenticatedUser;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: true;
        message: string;
        devOtp?: string;
    }>;
    verifyResetOtp(dto: VerifyResetOtpDto): Promise<{
        resetToken: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: true;
    }>;
    refreshTokens(user: AuthenticatedUser): Promise<{
        accessToken: string;
        refreshToken: string;
        user: AuthenticatedUser;
    }>;
    getMe(userId: string): Promise<AuthenticatedUser>;
    updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<AuthenticatedUser>;
    logout(userId: string): Promise<void>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: AuthenticatedUser;
    }>;
    setRefreshTokenCookie(res: Response, refreshToken: string): void;
    clearRefreshTokenCookie(res: Response): void;
    private issueTokens;
    private toAuthUser;
    private signAccessToken;
    private signRefreshToken;
    private resolvePlanId;
}
