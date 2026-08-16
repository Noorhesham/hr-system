import { Strategy } from 'passport-jwt';
import type { OnboardingStep, SubscriptionStatus } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    companyId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
    isPlatformAdmin: boolean;
    isPortalUser: boolean;
    employeeId: string | null;
    onboardingStep?: OnboardingStep | null;
    onboardingCompletedAt?: string | null;
    planId?: string | null;
    subscriptionStatus?: SubscriptionStatus | null;
}
export interface AuthenticatedUser {
    userId: string;
    email: string;
    companyId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
    isPlatformAdmin: boolean;
    isPortalUser: boolean;
    employeeId: string | null;
    onboardingStep: OnboardingStep | null;
    onboardingCompletedAt: string | null;
    fullName: string | null;
    phone: string | null;
    jobTitle: string | null;
    planId: string | null;
    subscriptionStatus: SubscriptionStatus | null;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): AuthenticatedUser;
}
export {};
