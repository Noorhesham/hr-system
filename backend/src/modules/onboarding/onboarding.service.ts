import { Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingStep } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';

/** Ordered progress through post-auth onboarding (high-water-mark). */
const STEP_ORDER: OnboardingStep[] = [
  OnboardingStep.PRICING,
  OnboardingStep.ATTENDANCE,
  OnboardingStep.PAYROLL,
  OnboardingStep.BENEFITS,
  OnboardingStep.EMPLOYEES,
  OnboardingStep.COMPLETE,
];

@Injectable()
export class OnboardingService {
  constructor(private readonly db: DatabaseService) {}

  async getState(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      step: user.onboardingStep,
      completedAt: user.onboardingCompletedAt,
    };
  }

  /**
   * Advances onboardingStep to `step` only when it is at or ahead of the
   * current high-water-mark. Revisiting an earlier step to edit does not
   * reset progress.
   */
  async updateState(userId: string, step: OnboardingStep) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.onboardingCompletedAt) {
      return {
        step: OnboardingStep.COMPLETE,
        completedAt: user.onboardingCompletedAt,
      };
    }

    const current = user.onboardingStep;
    const next =
      current == null || stepIndex(step) >= stepIndex(current) ? step : current;

    const updated = await this.db.user.update({
      where: { id: userId },
      data: { onboardingStep: next },
      select: {
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });

    return {
      step: updated.onboardingStep,
      completedAt: updated.onboardingCompletedAt,
    };
  }

  async complete(userId: string) {
    const updated = await this.db.user.update({
      where: { id: userId },
      data: {
        onboardingStep: OnboardingStep.COMPLETE,
        onboardingCompletedAt: new Date(),
      },
      select: {
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });
    return {
      step: updated.onboardingStep,
      completedAt: updated.onboardingCompletedAt,
    };
  }
}

function stepIndex(step: OnboardingStep): number {
  const idx = STEP_ORDER.indexOf(step);
  return idx < 0 ? 0 : idx;
}
