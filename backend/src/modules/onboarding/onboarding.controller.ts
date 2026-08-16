import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { OnboardingStep } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../tenant/decorators/tenant.decorator';
import { OnboardingService } from './onboarding.service';
import { UpdateOnboardingStateDto } from './dto/update-onboarding-state.dto';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  /** Current wizard progress for the authenticated owner. */
  @Get('state')
  getState(@CurrentUser('userId') userId: string) {
    return this.onboarding.getState(userId);
  }

  /**
   * Advance (or no-op) the high-water-mark step. Cannot move backward.
   * Does not clear `onboardingCompletedAt` once set.
   */
  @Patch('state')
  @ApiBody({
    type: UpdateOnboardingStateDto,
    examples: {
      default: {
        summary: 'Move to payroll step',
        value: { step: OnboardingStep.PAYROLL },
      },
    },
  })
  updateState(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateOnboardingStateDto,
  ) {
    return this.onboarding.updateState(userId, dto.step);
  }

  /** Mark onboarding finished (complete step + timestamp). */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  complete(@CurrentUser('userId') userId: string) {
    return this.onboarding.complete(userId);
  }
}
