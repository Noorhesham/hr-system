import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RoleService } from './role.service';
import { AssignUserRoleDto, CreateRoleDto, UnassignUsersDto, UpdateRoleDto } from './dto/role.dto';
export declare class RoleController {
    private readonly roles;
    constructor(roles: RoleService);
    listPermissions(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        action: string;
    }[]>;
    listRoles(companyId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isSystem: boolean;
        isLocked: boolean;
        userCount: number;
        permissions: {
            id: string;
            action: string;
        }[];
        createdAt: string;
        updatedAt: string;
    }[]>;
    listUsers(companyId: string): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
        fullName: string | null;
        roleId: string;
        isPortalUser: boolean;
    }[]>;
    listRoleUsers(companyId: string, id: string): Promise<{
        id: string;
        email: string;
        fullName: string | null;
        isPortalUser: boolean;
        assignedAt: string;
        employeeId: string | null;
        employeeCode: string | null;
        department: string | null;
        departmentId: string | null;
        photoUrl: string | null;
    }[]>;
    findOne(companyId: string, id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isSystem: boolean;
        isLocked: boolean;
        userCount: number;
        permissions: {
            id: string;
            action: string;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    create(companyId: string, dto: CreateRoleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isSystem: boolean;
        isLocked: boolean;
        userCount: number;
        permissions: {
            id: string;
            action: string;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    update(companyId: string, id: string, dto: UpdateRoleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isSystem: boolean;
        isLocked: boolean;
        userCount: number;
        permissions: {
            id: string;
            action: string;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    unassignUsers(companyId: string, id: string, dto: UnassignUsersDto, actor: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
    assignUserRole(companyId: string, userId: string, dto: AssignUserRoleDto, actor: AuthenticatedUser): Promise<{
        id: string;
        role: {
            id: string;
            name: string;
        };
        email: string;
        fullName: string | null;
        roleId: string;
    }>;
}
