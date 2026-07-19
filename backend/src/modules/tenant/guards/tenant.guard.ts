import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Defense-in-depth guard for multi-tenancy.
 *
 * Must run AFTER an authentication guard (e.g. `JwtAuthGuard`) that populates
 * `request.user`. It guarantees no tenant-scoped handler can execute without a
 * resolved `companyId`, so the `@Tenant()` decorator always has a value.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.user?.companyId) {
      throw new ForbiddenException('No tenant context on request');
    }
    return true;
  }
}
