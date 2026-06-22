import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, ForgotPasswordDto, TwoFADto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { Throttle } from '@nestjs/throttler';
import { REDIS_CLIENT } from '../../core/redis/redis.module';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Basic boilerplate login handler
    // In production, verify user credentials and call handleFailedLogin on mismatch
    return { message: 'Login endpoint' };
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return { message: 'Password forgot endpoint' };
  }

  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  async authenticate2FA(@Body() dto: TwoFADto) {
    return { message: '2FA authentication endpoint' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listUsers() {
    return { message: 'Admin users list endpoint' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @GetUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.generateTokens(user);
    this.authService.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // Simulating callback code redirect logic
    const tokens = { accessToken: 'dummy_access', refreshToken: 'dummy_refresh' };
    const code = crypto.randomUUID();
    await this.redis.setex(`google:code:${code}`, 120, JSON.stringify(tokens));
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }
}
