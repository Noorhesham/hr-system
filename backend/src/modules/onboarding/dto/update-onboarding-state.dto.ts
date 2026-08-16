import { ApiProperty } from '@nestjs/swagger';
import { OnboardingStep } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** PATCH /onboarding/state — advances the owner's wizard high-water-mark. */
export class UpdateOnboardingStateDto {
  @ApiProperty({
    enum: OnboardingStep,
    example: OnboardingStep.PAYROLL,
    description:
      'Desired step. Only monotonic advances are applied; going backward is a no-op.',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}
