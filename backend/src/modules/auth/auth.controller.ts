import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
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
        value: { email: 'admin@acme.com', password: 'Passw0rd!' },
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

  /** Echo the authenticated principal (handy for verifying a token). */
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
