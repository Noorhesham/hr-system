import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

/**
 * Injects the authenticated user's `companyId` (the tenant scope) extracted by
 * the JwtStrategy. Use this on every tenant-scoped handler so the service layer
 * always receives a trusted companyId from the token — never from the client.
 *
 * @example
 *   getPolicy(@Tenant() companyId: string) { ... }
 */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const companyId = (request.user as AuthenticatedUser | undefined)
      ?.companyId;
    if (!companyId) {
      // Should never happen behind JwtAuthGuard/TenantGuard, but fail closed.
      throw new UnauthorizedException('Missing tenant context');
    }
    return companyId;
  },
);

/**
 * Injects the full authenticated user (or a single field of it) from the JWT.
 *
 * @example
 *   me(@CurrentUser() user: AuthenticatedUser) { ... }
 *   getId(@CurrentUser('userId') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    return data ? user?.[data] : user;
  },
);
