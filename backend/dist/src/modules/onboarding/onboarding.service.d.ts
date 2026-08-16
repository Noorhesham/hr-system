import { OnboardingStep } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
export declare class OnboardingService {
    private readonly db;
    constructor(db: DatabaseService);
    getState(userId: string): Promise<{
        step: import("@prisma/client").$Enums.OnboardingStep | null;
        completedAt: Date | null;
    }>;
    updateState(userId: string, step: OnboardingStep): Promise<{
        step: import("@prisma/client").$Enums.OnboardingStep | null;
        completedAt: Date | null;
    }>;
    complete(userId: string): Promise<{
        step: import("@prisma/client").$Enums.OnboardingStep | null;
        completedAt: Date | null;
    }>;
}
