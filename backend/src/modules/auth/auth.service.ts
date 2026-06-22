import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { REDIS_CLIENT } from '../../core/redis/redis.module';
import Redis from 'ioredis';
import { User } from '@prisma/client';
import * as OTPAuth from 'otpauth';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─── Token generation ──────────────────────────────────────────────────
  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role } as any,
        {
          secret: process.env.JWT_SECRET,
          expiresIn: (process.env.JWT_EXPIRY || '15m') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id } as any,
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: (process.env.JWT_REFRESH_EXPIRY || '30d') as any,
        },
      ),
    ]);

    // Store refresh token as hash in DB
    await this.db.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await this.hashingService.hash(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  // ─── Set refresh token as httpOnly cookie ─────────────────────────────
  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    });
  }

  // ─── Account lockout (brute force protection) ─────────────────────────
  async handleFailedLogin(user: User) {
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
      // NOTE: In production, you would emit an event for admin notifications here.
      throw new ForbiddenException({
        message: 'Too many failed attempts',
        errorCode: 'ACCOUNT_LOCKED',
        lockoutUntil: lockedUntil,
      });
    }
  }

  // ─── 2FA: TOTP ────────────────────────────────────────────────────────
  async generate2FA(userId: string) {
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

  async validate2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      return false;
    }
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });
    return totp.validate({ token: code, window: 1 }) !== null;
  }

  // ─── Google OAuth: one-time code exchange (prevents tokens in URL) ────
  async exchangeGoogleCode(code: string) {
    const data = await this.redis.get(`google:code:${code}`);
    if (!data) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    await this.redis.del(`google:code:${code}`);
    return JSON.parse(data); // { accessToken, refreshToken }
  }
}
