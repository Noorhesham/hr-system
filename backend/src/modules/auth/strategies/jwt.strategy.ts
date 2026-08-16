import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { OnboardingStep, SubscriptionStatus } from '@prisma/client';

/** Claims carried inside the signed access token. `sub` is the userId. */
export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  isPlatformAdmin: boolean;
  isPortalUser: boolean;
  employeeId: string | null;
  onboardingStep?: OnboardingStep | null;
  onboardingCompletedAt?: string | null;
  planId?: string | null;
  subscriptionStatus?: SubscriptionStatus | null;
}

/** Shape attached to `request.user` after a token is validated. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  companyId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  isPlatformAdmin: boolean;
  isPortalUser: boolean;
  employeeId: string | null;
  onboardingStep: OnboardingStep | null;
  onboardingCompletedAt: string | null;
  fullName: string | null;
  phone: string | null;
  jobTitle: string | null;
  planId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'fallback-secret-minimum-32-characters',
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions ?? [],
      isPlatformAdmin: payload.isPlatformAdmin,
      isPortalUser: payload.isPortalUser ?? false,
      employeeId: payload.employeeId ?? null,
      onboardingStep: payload.onboardingStep ?? null,
      onboardingCompletedAt: payload.onboardingCompletedAt ?? null,
      fullName: null,
      phone: null,
      jobTitle: null,
      planId: payload.planId ?? null,
      subscriptionStatus: payload.subscriptionStatus ?? null,
    };
  }
}
