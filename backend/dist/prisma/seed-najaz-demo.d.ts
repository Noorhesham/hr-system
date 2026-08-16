import { PrismaClient } from '@prisma/client';
export declare const NAJAZ_DEMO: {
    companyId: string;
    email: string;
    password: string;
    name: string;
    fullName: string;
    jobTitle: string;
    establishmentNumber: string;
};
export declare function seedNajazDemo(prisma: PrismaClient, planId: string): Promise<void>;
