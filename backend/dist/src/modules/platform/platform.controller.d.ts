import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
export declare class PlatformController {
    private readonly settings;
    constructor(settings: PlatformSettingsService);
    getSettings(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        defaultTrialMaxEmployees: number;
        trialDays: number;
    }>;
    updateSettings(dto: UpdatePlatformSettingDto): import("@prisma/client").Prisma.Prisma__PlatformSettingClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        defaultTrialMaxEmployees: number;
        trialDays: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
