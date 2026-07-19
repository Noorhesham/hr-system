import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

/**
 * Global (platform-wide) settings — the dynamic defaults applied to TRIAL /
 * no-plan companies (seat cap + trial length).
 *
 * These values are GLOBAL (shared by every tenant), so the routes require a
 * platform-level superuser (`isPlatformAdmin`), NOT a tenant "Company Owner".
 */
@ApiTags('Platform')
@ApiBearerAuth()
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class PlatformController {
  constructor(private readonly settings: PlatformSettingsService) {}

  /** Read the current global defaults. */
  @Get('settings')
  getSettings() {
    return this.settings.getSettings();
  }

  /** Update the global defaults (trial seat cap / trial length). */
  @Patch('settings')
  @ApiBody({
    type: UpdatePlatformSettingDto,
    examples: {
      default: {
        summary: 'Update platform defaults',
        value: { defaultTrialMaxEmployees: 25, trialDays: 30 },
      },
    },
  })
  updateSettings(@Body() dto: UpdatePlatformSettingDto) {
    return this.settings.updateSettings(dto);
  }
}
