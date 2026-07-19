import { DatabaseService } from '../../database/database.service';
import { PlatformSettingsService } from './platform-settings.service';
export interface EffectiveLimits {
    maxEmployees: number;
}
export declare class LimitsService {
    private readonly db;
    private readonly settings;
    constructor(db: DatabaseService, settings: PlatformSettingsService);
    getEffectiveLimits(companyId: string): Promise<EffectiveLimits>;
    assertCanAddEmployee(companyId: string): Promise<void>;
}
