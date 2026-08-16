import { DatabaseService } from '../../database/database.service';
export declare class UserService {
    private readonly db;
    constructor(db: DatabaseService);
    findByEmail(email: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        company: {
            planId: string | null;
            subscriptionStatus: import("@prisma/client").$Enums.SubscriptionStatus;
        };
        role: {
            name: string;
            permissions: {
                action: string;
            }[];
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
        fullName: string | null;
        phone: string | null;
        jobTitle: string | null;
        roleId: string;
        isPortalUser: boolean;
        refreshTokenHash: string | null;
        isPlatformAdmin: boolean;
        passwordResetOtpHash: string | null;
        passwordResetOtpExpiresAt: Date | null;
        onboardingStep: import("@prisma/client").$Enums.OnboardingStep | null;
        onboardingCompletedAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findById(id: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        company: {
            planId: string | null;
            subscriptionStatus: import("@prisma/client").$Enums.SubscriptionStatus;
        };
        role: {
            name: string;
            permissions: {
                action: string;
            }[];
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
        fullName: string | null;
        phone: string | null;
        jobTitle: string | null;
        roleId: string;
        isPortalUser: boolean;
        refreshTokenHash: string | null;
        isPlatformAdmin: boolean;
        passwordResetOtpHash: string | null;
        passwordResetOtpExpiresAt: Date | null;
        onboardingStep: import("@prisma/client").$Enums.OnboardingStep | null;
        onboardingCompletedAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
