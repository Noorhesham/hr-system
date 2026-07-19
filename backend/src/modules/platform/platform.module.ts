import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PlatformSettingsService } from './platform-settings.service';
import { LimitsService } from './limits.service';
import { PlatformController } from './platform.controller';

/**
 * Platform-wide (non-tenant) concerns: global settings + the limits resolver.
 * Exported so feature modules (Auth now; Employee later) can inject them.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [PlatformController],
  providers: [PlatformSettingsService, LimitsService],
  exports: [PlatformSettingsService, LimitsService],
})
export class PlatformModule {}
