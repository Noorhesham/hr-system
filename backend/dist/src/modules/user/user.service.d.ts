import { DatabaseService } from '../../database/database.service';
export declare class UserService {
    private readonly db;
    constructor(db: DatabaseService);
    findByEmail(email: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        role: {
            name: string;
        };
        employee: {
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string;
        password: string;
        roleId: string;
        isPortalUser: boolean;
        refreshTokenHash: string | null;
        isPlatformAdmin: boolean;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findById(id: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        role: {
            name: string;
        };
        employee: {
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string;
        password: string;
        roleId: string;
        isPortalUser: boolean;
        refreshTokenHash: string | null;
        isPlatformAdmin: boolean;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
