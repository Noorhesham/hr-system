import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/** Claims carried inside the signed access token. `sub` is the userId. */
export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roleId: string;
  roleName: string;
  isPlatformAdmin: boolean;
  /** True when this login is an employee portal account. */
  isPortalUser: boolean;
  /** Linked Employee.id for portal users; null for company admins. */
  employeeId: string | null;
}

/** Shape attached to `request.user` after a token is validated. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  companyId: string;
  roleId: string;
  /** Per-company role name (e.g. "Company Owner"). */
  roleName: string;
  /** Platform-level superuser flag (cross-tenant, all-access). */
  isPlatformAdmin: boolean;
  isPortalUser: boolean;
  /** Linked Employee.id for portal users; null for company admins. */
  employeeId: string | null;
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

  /**
   * Passport calls this with the decoded, signature-verified payload. The
   * returned object becomes `request.user` and is the single source of truth
   * for tenant scoping (`companyId`) and authorization (`roleName`,
   * `isPlatformAdmin`) downstream.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      isPlatformAdmin: payload.isPlatformAdmin,
      isPortalUser: payload.isPortalUser ?? false,
      employeeId: payload.employeeId ?? null,
    };
  }
}
