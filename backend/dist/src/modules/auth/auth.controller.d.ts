import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
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
    refresh(user: AuthenticatedUser, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, res: Response): Promise<{
        success: boolean;
    }>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto, res: Response): Promise<{
        accessToken: string;
    }>;
    me(user: AuthenticatedUser): AuthenticatedUser;
}
