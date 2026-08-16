import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto, VerifyResetOtpDto } from './dto/auth.dto';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<{
        accessToken: string;
        user: AuthenticatedUser;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        accessToken: string;
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
    refresh(user: AuthenticatedUser, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, res: Response): Promise<{
        success: boolean;
    }>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto, res: Response): Promise<{
        accessToken: string;
    }>;
    updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<AuthenticatedUser>;
    me(userId: string): Promise<AuthenticatedUser>;
}
