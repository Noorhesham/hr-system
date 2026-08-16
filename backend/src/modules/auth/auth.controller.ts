import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { CurrentUser } from '../tenant/decorators/tenant.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Provision a new company + admin user. Returns 201 with an access token and
   * sets the rotating refresh token as an httpOnly cookie.
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({
    type: RegisterDto,
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
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);
    this.authService.setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  /** Authenticate; returns an access token + sets the refresh cookie. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBody({
    type: LoginDto,
    examples: {
      default: {
        summary: 'Login',
        value: { email: 'owner@najd.sa', password: 'Owner@1234' },
      },
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(dto);
    this.authService.setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  /**
   * Request a 6-digit password-reset OTP. Always 200 (no email enumeration).
   * Non-production responses include `devOtp` for local testing (also logged).
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      default: {
        summary: 'Request OTP',
        value: { email: 'owner@najd.sa' },
      },
    },
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /** Verify OTP → short-lived `resetToken` for POST /auth/reset-password. */
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBody({
    type: VerifyResetOtpDto,
    examples: {
      default: {
        summary: 'Verify OTP',
        value: { email: 'owner@najd.sa', code: '123456' },
      },
    },
  })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  /** Set a new password using the reset token from verify-reset-otp. */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      default: {
        summary: 'Reset password',
        value: {
          resetToken: '<from verify-reset-otp>',
          newPassword: 'Owner@1234',
        },
      },
    },
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Exchange a valid refresh cookie for a new token pair (rotation).
   * The old refresh token is invalidated server-side.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(user);
    this.authService.setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  /** Revoke the refresh token (server-side) and clear the cookie. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.authService.clearRefreshTokenCookie(res);
    return { success: true };
  }

  /**
   * Change the current user's password (employees included). Verifies the
   * current password, then re-issues tokens (old refresh sessions are revoked).
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      default: {
        summary: 'Change password',
        value: { currentPassword: 'Passw0rd!', newPassword: 'NewPassw0rd!' },
      },
    },
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.changePassword(user, dto);
    this.authService.setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  /** Update display profile (fullName / phone / jobTitle). Email cannot be changed. */
  @Patch('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: UpdateProfileDto,
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
  })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user, dto);
  }

  /** Echo the authenticated principal (handy for verifying a token). */
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }
}
