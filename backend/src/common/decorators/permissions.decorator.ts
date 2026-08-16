import { SetMetadata } from '@nestjs/common';
import type { PermissionAction } from '../constants/permissions.constant';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restrict a route to users who have at least one of the listed permission
 * actions on their role. Company Owner always bypasses (see PermissionsGuard).
 *
 * @example @Permissions(PERMISSIONS.MANAGE_PAYROLL)
 */
export const Permissions = (...permissions: PermissionAction[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
