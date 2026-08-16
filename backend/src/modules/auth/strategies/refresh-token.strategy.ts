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
        role: {
          select: {
            name: true,
            permissions: { select: { action: true } },
          },
        },
        employee: { select: { id: true } },
        company: { select: { planId: true, subscriptionStatus: true } },
      },
    });
    if (!user || !user.refreshTokenHash) {
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
      permissions: user.role.permissions.map((p) => p.action),
      isPlatformAdmin: user.isPlatformAdmin,
      isPortalUser: user.isPortalUser,
      employeeId: user.employee?.id ?? null,
      onboardingStep: user.onboardingStep ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt
        ? user.onboardingCompletedAt.toISOString()
        : null,
      fullName: user.fullName ?? null,
      phone: user.phone ?? null,
      jobTitle: user.jobTitle ?? null,
      planId: user.company?.planId ?? null,
      subscriptionStatus: user.company?.subscriptionStatus ?? null,
    };
  }
}
