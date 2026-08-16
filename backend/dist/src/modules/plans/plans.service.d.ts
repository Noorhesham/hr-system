import { DatabaseService } from '../../database/database.service';
import { PlatformSettingsService } from '../platform/platform-settings.service';
import { SubscribeDto } from './dto/subscribe.dto';
export declare class PlansService {
    private readonly db;
    private readonly platform;
    constructor(db: DatabaseService, platform: PlatformSettingsService);
    listPlans(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        maxEmployees: number;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    startTrial(companyId: string, userId: string): Promise<{
        status: "TRIAL";
        planId: string | null;
        planName: string;
        trialEndsAt: string;
        trialDays: number;
        maxEmployees: number;
    }>;
    subscribe(companyId: string, userId: string, dto: SubscribeDto): Promise<{
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
