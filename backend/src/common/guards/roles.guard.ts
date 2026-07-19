import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-name based authorization. Reads the names required by `@Roles(...)` and
 * compares them to the authenticated user's `roleName` (set by JwtStrategy).
 * A handler/class with no `@Roles` is unrestricted.
 *
 * Must run AFTER JwtAuthGuard so `request.user` is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true; // no @Roles → no role restriction
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user?.roleName || !required.includes(user.roleName)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
