import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, ForgotPasswordDto, TwoFADto } from './dto/auth.dto';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import Redis from 'ioredis';
export declare class AuthController {
    private readonly authService;
    private readonly redis;
    constructor(authService: AuthService, redis: Redis);
    login(dto: LoginDto, res: Response): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    authenticate2FA(dto: TwoFADto): Promise<{
        message: string;
    }>;
    getMe(user: AuthenticatedUser): Promise<AuthenticatedUser>;
    listUsers(): Promise<{
        message: string;
    }>;
    refresh(user: any, res: Response): Promise<{
        accessToken: string;
    }>;
    googleCallback(req: any, res: Response): Promise<void>;
}
