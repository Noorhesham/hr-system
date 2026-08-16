import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { COMPANY_OWNER_ROLE } from '../constants/roles.constant';
import type { PermissionAction } from '../constants/permissions.constant';

/**
 * Permission-action authorization. Reads `@Permissions(...)` and checks
 * `request.user.permissions`. Company Owner always passes.
 * No `@Permissions` → unrestricted (same pattern as RolesGuard).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionAction[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.roleName === COMPANY_OWNER_ROLE || user.isPlatformAdmin) {
      return true;
    }

    const owned: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];
    const ok = required.some((p) => owned.includes(p));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
