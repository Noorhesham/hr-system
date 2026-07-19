import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { DatabaseService } from '../../../database/database.service';
import { HashingService } from '../../../core/hashing/hashing.service';
import { AuthenticatedUser } from './jwt.strategy';

/** Refresh-token payload only needs the subject (userId). */
interface RefreshPayload {
  sub: string;
}

/**
 * Validates the rotating refresh token carried in the httpOnly `refreshToken`
 * cookie. Two checks: (1) the JWT signature/expiry, (2) the raw token matches
 * the bcrypt hash stored on the user — so a logged-out / rotated token is
 * rejected even if its signature is still valid.
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly db: DatabaseService,
    private readonly hashing: HashingService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken ?? null,
      ]),
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ||
        'fallback-refresh-secret-minimum-32-characters',
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: RefreshPayload,
  ): Promise<AuthenticatedUser> {
    const token = req?.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: { select: { name: true } },
        employee: { select: { id: true } },
      },
    });
    if (!user || !user.refreshTokenHash) {
      // No stored hash => the session was revoked (logout) or never existed.
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const matches = await this.hashing.compare(token, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role.name,
      isPlatformAdmin: user.isPlatformAdmin,
      isPortalUser: user.isPortalUser,
      employeeId: user.employee?.id ?? null,
    };
  }
}
