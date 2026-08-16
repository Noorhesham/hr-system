import { PlansService } from './plans.service';
import { SubscribeDto } from './dto/subscribe.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
export declare class PlansController {
    private readonly plans;
    constructor(plans: PlansService);
    listPlans(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        maxEmployees: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    startTrial(companyId: string, user: AuthenticatedUser): Promise<{
        status: "TRIAL";
        planId: string | null;
        planName: string;
        trialEndsAt: string;
        trialDays: number;
        maxEmployees: number;
    }>;
    subscribe(companyId: string, user: AuthenticatedUser, dto: SubscribeDto): Promise<{
        subscriptionNumber: string;
        invoiceNumber: string;
        planId: string;
        planName: string;
        billingCycle: "MONTHLY" | "ANNUAL";
        subtotal: number;
        discountApplied: number;
        promoCode: string | null;
        amount: number;
        currency: string;
        paidAt: string;
        nextBillingDate: string;
        status: "PAID";
        maxEmployees: number;
        cardHolderName: string;
    }>;
}
