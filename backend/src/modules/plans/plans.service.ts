import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingStep, SubscriptionStatus } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PlatformSettingsService } from '../platform/platform-settings.service';
import { SubscribeDto } from './dto/subscribe.dto';

/** Hardcoded first-invoice promo. */
const WELCOME_PROMO = 'WELCOME20';
const WELCOME_DISCOUNT = 0.2;

@Injectable()
export class PlansService {
  constructor(
    private readonly db: DatabaseService,
    private readonly platform: PlatformSettingsService,
  ) {}

  listPlans() {
    return this.db.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      select: {
        id: true,
        name: true,
        monthlyPrice: true,
        maxEmployees: true,
      },
    });
  }

  /**
   * Continue with free trial — no card required.
   * Keeps subscriptionStatus=TRIAL, attaches the Basic plan for feature
   * context, and advances onboarding past the PRICING gate.
   */
  async startTrial(companyId: string, userId: string) {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        planId: true,
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (company.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Company already has an active paid subscription',
      );
    }

    const { trialDays, defaultTrialMaxEmployees } =
      await this.platform.getSettings();

    const basic = await this.db.subscriptionPlan.findFirst({
      where: { name: 'Basic' },
      select: { id: true, name: true },
    });

    const now = new Date();
    let trialEndsAt = company.trialEndsAt;
    if (!trialEndsAt || trialEndsAt.getTime() < now.getTime()) {
      trialEndsAt = new Date(
        now.getTime() + trialDays * 24 * 60 * 60 * 1000,
      );
    }

    await this.db.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt,
          ...(basic ? { planId: basic.id } : {}),
          billingCycle: null,
          nextBillingDate: null,
        },
      });

      await bumpPastPricing(tx, userId);
    });

    return {
      status: 'TRIAL' as const,
      planId: basic?.id ?? company.planId ?? null,
      planName: basic?.name ?? 'Basic',
      trialEndsAt: trialEndsAt.toISOString(),
      trialDays,
      maxEmployees: defaultTrialMaxEmployees,
    };
  }

  /**
   * Dummy payment: declines when card digits end in 0000; otherwise activates
   * the company subscription and advances the owner past the PRICING gate.
   */
  async subscribe(
    companyId: string,
    userId: string,
    dto: SubscribeDto,
  ) {
    const digits = dto.cardNumber.replace(/\D/g, '');
    if (digits.endsWith('0000')) {
      throw new BadRequestException(
        'Payment declined by the issuing bank (dummy fail: card ends in 0000)',
      );
    }

    const plan = await this.db.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const monthly = plan.monthlyPrice.toNumber();
    // Annual = 10× monthly ("2 months free") — documented placeholder.
    const subtotal =
      dto.billingCycle === 'ANNUAL' ? monthly * 10 : monthly;

    const promo =
      dto.promoCode?.trim().toUpperCase() === WELCOME_PROMO
        ? WELCOME_PROMO
        : null;
    const discountApplied = promo ? +(subtotal * WELCOME_DISCOUNT).toFixed(2) : 0;
    const amount = +(subtotal - discountApplied).toFixed(2);

    const now = new Date();
    const nextBillingDate = new Date(now);
    if (dto.billingCycle === 'ANNUAL') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    }

    await this.db.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          planId: plan.id,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          billingCycle: dto.billingCycle,
          nextBillingDate,
        },
      });

      await bumpPastPricing(tx, userId);
    });

    const year = now.getFullYear();
    const rand5 = () =>
      Math.floor(10000 + Math.random() * 90000).toString();

    return {
      subscriptionNumber: `SUB-${year}-${rand5()}`,
      invoiceNumber: `INV-${year}-${rand5()}`,
      planId: plan.id,
      planName: plan.name,
      billingCycle: dto.billingCycle,
      subtotal,
      discountApplied,
      promoCode: promo,
      amount,
      currency: 'SAR',
      paidAt: now.toISOString(),
      nextBillingDate: nextBillingDate.toISOString(),
      status: 'PAID' as const,
      maxEmployees: plan.maxEmployees,
      cardHolderName: dto.cardHolderName,
    };
  }
}

type Tx = Parameters<Parameters<DatabaseService['$transaction']>[0]>[0];

async function bumpPastPricing(tx: Tx, userId: string) {
  const owner = await tx.user.findUnique({
    where: { id: userId },
    select: { onboardingStep: true, onboardingCompletedAt: true },
  });
  if (!owner || owner.onboardingCompletedAt) return;
  const current = owner.onboardingStep;
  const desired = OnboardingStep.ATTENDANCE;
  const shouldBump =
    current == null ||
    current === OnboardingStep.PRICING ||
    stepOrder(desired) >= stepOrder(current);
  if (shouldBump) {
    await tx.user.update({
      where: { id: userId },
      data: { onboardingStep: desired },
    });
  }
}

const ORDER: OnboardingStep[] = [
  OnboardingStep.PRICING,
  OnboardingStep.ATTENDANCE,
  OnboardingStep.PAYROLL,
  OnboardingStep.BENEFITS,
  OnboardingStep.EMPLOYEES,
  OnboardingStep.COMPLETE,
];

function stepOrder(step: OnboardingStep): number {
  const i = ORDER.indexOf(step);
  return i < 0 ? 0 : i;
}
