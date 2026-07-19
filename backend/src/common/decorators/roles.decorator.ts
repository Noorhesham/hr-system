import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to users whose (tenant) role name is in the given list.
 * Works with the dynamic, per-company Role model — compare against the
 * `roleName` claim placed on the JWT.
 *
 * @example @Roles(SUPER_ADMIN_ROLE)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
