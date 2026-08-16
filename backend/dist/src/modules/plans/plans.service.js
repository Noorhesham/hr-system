"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const platform_settings_service_1 = require("../platform/platform-settings.service");
const WELCOME_PROMO = 'WELCOME20';
const WELCOME_DISCOUNT = 0.2;
let PlansService = class PlansService {
    db;
    platform;
    constructor(db, platform) {
        this.db = db;
        this.platform = platform;
    }
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
    async startTrial(companyId, userId) {
        const company = await this.db.company.findUnique({
            where: { id: companyId },
            select: {
                subscriptionStatus: true,
                trialEndsAt: true,
                planId: true,
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        if (company.subscriptionStatus === client_1.SubscriptionStatus.ACTIVE) {
            throw new common_1.BadRequestException('Company already has an active paid subscription');
        }
        const { trialDays, defaultTrialMaxEmployees } = await this.platform.getSettings();
        const basic = await this.db.subscriptionPlan.findFirst({
            where: { name: 'Basic' },
            select: { id: true, name: true },
        });
        const now = new Date();
        let trialEndsAt = company.trialEndsAt;
        if (!trialEndsAt || trialEndsAt.getTime() < now.getTime()) {
            trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
        }
        await this.db.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: companyId },
                data: {
                    subscriptionStatus: client_1.SubscriptionStatus.TRIAL,
                    trialEndsAt,
                    ...(basic ? { planId: basic.id } : {}),
                    billingCycle: null,
                    nextBillingDate: null,
                },
            });
            await bumpPastPricing(tx, userId);
        });
        return {
            status: 'TRIAL',
            planId: basic?.id ?? company.planId ?? null,
            planName: basic?.name ?? 'Basic',
            trialEndsAt: trialEndsAt.toISOString(),
            trialDays,
            maxEmployees: defaultTrialMaxEmployees,
        };
    }
    async subscribe(companyId, userId, dto) {
        const digits = dto.cardNumber.replace(/\D/g, '');
        if (digits.endsWith('0000')) {
            throw new common_1.BadRequestException('Payment declined by the issuing bank (dummy fail: card ends in 0000)');
        }
        const plan = await this.db.subscriptionPlan.findUnique({
            where: { id: dto.planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Subscription plan not found');
        }
        const monthly = plan.monthlyPrice.toNumber();
        const subtotal = dto.billingCycle === 'ANNUAL' ? monthly * 10 : monthly;
        const promo = dto.promoCode?.trim().toUpperCase() === WELCOME_PROMO
            ? WELCOME_PROMO
            : null;
        const discountApplied = promo ? +(subtotal * WELCOME_DISCOUNT).toFixed(2) : 0;
        const amount = +(subtotal - discountApplied).toFixed(2);
        const now = new Date();
        const nextBillingDate = new Date(now);
        if (dto.billingCycle === 'ANNUAL') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }
        else {
            nextBillingDate.setDate(nextBillingDate.getDate() + 30);
        }
        await this.db.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: companyId },
                data: {
                    planId: plan.id,
                    subscriptionStatus: client_1.SubscriptionStatus.ACTIVE,
                    billingCycle: dto.billingCycle,
                    nextBillingDate,
                },
            });
            await bumpPastPricing(tx, userId);
        });
        const year = now.getFullYear();
        const rand5 = () => Math.floor(10000 + Math.random() * 90000).toString();
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
            status: 'PAID',
            maxEmployees: plan.maxEmployees,
            cardHolderName: dto.cardHolderName,
        };
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        platform_settings_service_1.PlatformSettingsService])
], PlansService);
async function bumpPastPricing(tx, userId) {
    const owner = await tx.user.findUnique({
        where: { id: userId },
        select: { onboardingStep: true, onboardingCompletedAt: true },
    });
    if (!owner || owner.onboardingCompletedAt)
        return;
    const current = owner.onboardingStep;
    const desired = client_1.OnboardingStep.ATTENDANCE;
    const shouldBump = current == null ||
        current === client_1.OnboardingStep.PRICING ||
        stepOrder(desired) >= stepOrder(current);
    if (shouldBump) {
        await tx.user.update({
            where: { id: userId },
            data: { onboardingStep: desired },
        });
    }
}
const ORDER = [
    client_1.OnboardingStep.PRICING,
    client_1.OnboardingStep.ATTENDANCE,
    client_1.OnboardingStep.PAYROLL,
    client_1.OnboardingStep.BENEFITS,
    client_1.OnboardingStep.EMPLOYEES,
    client_1.OnboardingStep.COMPLETE,
];
function stepOrder(step) {
    const i = ORDER.indexOf(step);
    return i < 0 ? 0 : i;
}
//# sourceMappingURL=plans.service.js.map