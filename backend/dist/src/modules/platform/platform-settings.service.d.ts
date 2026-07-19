import { DatabaseService } from '../../database/database.service';
export interface UpdatePlatformSettingInput {
    defaultTrialMaxEmployees?: number;
    trialDays?: number;
}
export declare class PlatformSettingsService {
    private readonly db;
    constructor(db: DatabaseService);
    getSettings(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        defaultTrialMaxEmployees: number;
        trialDays: number;
    }>;
    updateSettings(input: UpdatePlatformSettingInput): import("@prisma/client").Prisma.Prisma__PlatformSettingClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        defaultTrialMaxEmployees: number;
        trialDays: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
