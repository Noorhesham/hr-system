import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/** The fixed primary key of the single platform-settings row. */
const SINGLETON_ID = 'global';

/** Fields a platform operator may change (no controller wired yet). */
export interface UpdatePlatformSettingInput {
  defaultTrialMaxEmployees?: number;
  trialDays?: number;
}

/**
 * Read/write access to the single, platform-wide settings row. NOT
 * tenant-scoped — these are global defaults owned by the platform operator.
 */
@Injectable()
export class PlatformSettingsService {
  constructor(private readonly db: DatabaseService) {}

  /** Returns the singleton, lazily creating it with column defaults if absent. */
  async getSettings() {
    const existing = await this.db.platformSetting.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (existing) {
      return existing;
    }
    try {
      return await this.db.platformSetting.create({
        data: { id: SINGLETON_ID },
      });
    } catch {
      // A concurrent request created it first — fetch the now-existing row.
      return this.db.platformSetting.findUniqueOrThrow({
        where: { id: SINGLETON_ID },
      });
    }
  }

  /**
   * Update the global defaults. Intended for a future platform-operator
   * endpoint/guard; today it's callable from seeds/scripts only.
   */
  updateSettings(input: UpdatePlatformSettingInput) {
    return this.db.platformSetting.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...input },
      update: input,
    });
  }
}
