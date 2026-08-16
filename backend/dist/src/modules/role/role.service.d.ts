import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AssignUserRoleDto, CreateRoleDto, UnassignUsersDto, UpdateRoleDto } from './dto/role.dto';
export declare class RoleService {
    private readonly db;
    constructor(db: DatabaseService);
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
    findOne(companyId: string, roleId: string): Promise<{
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
    listRoleUsers(companyId: string, roleId: string): Promise<{
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
    update(companyId: string, roleId: string, dto: UpdateRoleDto): Promise<{
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
    remove(companyId: string, roleId: string): Promise<{
        success: boolean;
    }>;
    unassignUsers(companyId: string, roleId: string, dto: UnassignUsersDto, actor: AuthenticatedUser): Promise<{
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
    private mapRole;
    private findRoleOrThrow;
    private resolvePermissions;
}
