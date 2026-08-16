import type { Prisma, PrismaClient } from '@prisma/client';
type DbClient = PrismaClient | Prisma.TransactionClient;
export declare function provisionSystemRoles(db: DbClient, companyId: string): Promise<{
    ownerRoleId: string;
}>;
export {};
