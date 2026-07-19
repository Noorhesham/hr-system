import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Allows only platform-level superusers (the SaaS operator) — `isPlatformAdmin`
 * on the User / JWT. Use for cross-tenant / global resources (platform settings,
 * subscription plan management). Must run AFTER JwtAuthGuard.
 *
 * This is intentionally distinct from the per-company "Company Owner" role.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user?.isPlatformAdmin) {
      throw new ForbiddenException('Platform admin access required');
    }
    return true;
  }
}
