import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformService } from './platform.service';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { QueryPlatformCompaniesDto } from './dto/query-platform-companies.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

/**
 * Cross-tenant SaaS operator APIs. Require `isPlatformAdmin` — not a
 * company owner.
 */
@ApiTags('Platform')
@ApiBearerAuth()
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class PlatformController {
  constructor(
    private readonly settings: PlatformSettingsService,
    private readonly platform: PlatformService,
  ) {}

  @Get('settings')
  getSettings() {
    return this.settings.getSettings();
  }

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

  @Get('plans')
  listPlans() {
    return this.platform.listPlans();
  }

  @Post('plans')
  @ApiBody({ type: CreatePlanDto })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.platform.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiBody({ type: UpdatePlanDto })
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.platform.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  removePlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.platform.removePlan(id);
  }

  @Get('companies')
  listCompanies(@Query() query: QueryPlatformCompaniesDto) {
    return this.platform.listCompanies(query);
  }
}
