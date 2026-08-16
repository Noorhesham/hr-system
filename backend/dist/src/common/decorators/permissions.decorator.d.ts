import type { PermissionAction } from '../constants/permissions.constant';
export declare const PERMISSIONS_KEY = "permissions";
export declare const Permissions: (...permissions: PermissionAction[]) => import("@nestjs/common").CustomDecorator<string>;
