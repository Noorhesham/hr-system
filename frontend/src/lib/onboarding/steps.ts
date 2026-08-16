import type { OnboardingRouteStep } from "./draft"

/** Backend OnboardingStep enum (post-auth only). */
export type DbOnboardingStep =
  | "PRICING"
  | "ATTENDANCE"
  | "PAYROLL"
  | "BENEFITS"
  | "EMPLOYEES"
  | "COMPLETE"

export const ONBOARDING_ROUTE_ORDER: OnboardingRouteStep[] = [
  "welcome",
  "company-profile",
  "admin-account",
  "pricing",
  "payment",
  "attendance",
  "payroll",
  "benefits",
  "employees",
  "complete",
]

/**
 * Gate groups: routes in the same group share one high-water-mark.
 * e.g. pricing + payment are one billing gate — neither is "ahead of" the other.
 */
export const ONBOARDING_STEP_GROUPS: OnboardingRouteStep[][] = [
  ["welcome"],
  ["company-profile"],
  ["admin-account"],
  ["pricing", "payment"],
  ["attendance"],
  ["payroll"],
  ["benefits"],
  ["employees"],
  ["complete"],
]

const PRE_AUTH_STEPS: OnboardingRouteStep[] = [
  "welcome",
  "company-profile",
  "admin-account",
]

const DB_TO_ROUTE: Record<DbOnboardingStep, OnboardingRouteStep> = {
  PRICING: "pricing",
  ATTENDANCE: "attendance",
  PAYROLL: "payroll",
  BENEFITS: "benefits",
  EMPLOYEES: "employees",
  COMPLETE: "complete",
}

const ROUTE_TO_DB: Partial<Record<OnboardingRouteStep, DbOnboardingStep>> = {
  pricing: "PRICING",
  // payment is a sub-route of PRICING — advancing DB uses attendance after pay
  attendance: "ATTENDANCE",
  payroll: "PAYROLL",
  benefits: "BENEFITS",
  employees: "EMPLOYEES",
  complete: "COMPLETE",
}

export function routeForStep(step: OnboardingRouteStep): string {
  return `/onboarding/${step}`
}

export function stepIndex(step: OnboardingRouteStep): number {
  return ONBOARDING_ROUTE_ORDER.indexOf(step)
}

/** Index of the gate-group containing `route` (−1 if unknown). */
export function groupIndex(route: OnboardingRouteStep): number {
  return ONBOARDING_STEP_GROUPS.findIndex((g) => g.includes(route))
}

export function isPreAuthStep(step: OnboardingRouteStep): boolean {
  return PRE_AUTH_STEPS.includes(step)
}

export function isPostAuthStep(step: OnboardingRouteStep): boolean {
  return !isPreAuthStep(step)
}

export function dbStepToRoute(step: DbOnboardingStep | null | undefined): OnboardingRouteStep | null {
  if (!step) return null
  return DB_TO_ROUTE[step] ?? null
}

export function routeToDbStep(
  step: OnboardingRouteStep,
): DbOnboardingStep | null {
  return ROUTE_TO_DB[step] ?? null
}

/** Parse `/onboarding/<slug>` from a pathname. */
export function routeStepFromPathname(
  pathname: string,
): OnboardingRouteStep | null {
  const match = pathname.match(/\/onboarding\/([^/?#]+)/)
  if (!match?.[1]) return null
  const slug = match[1] as OnboardingRouteStep
  return ONBOARDING_ROUTE_ORDER.includes(slug) ? slug : null
}

/**
 * Resume route after login: prefer DB step, fall back to local, else dashboard.
 */
export function resumeRouteForUser(opts: {
  onboardingStep: DbOnboardingStep | null | undefined
  onboardingCompletedAt: string | null | undefined
  localStep?: OnboardingRouteStep | null
}): string {
  if (opts.onboardingCompletedAt) return "/dashboard"
  const fromDb = dbStepToRoute(opts.onboardingStep ?? null)
  if (fromDb) return routeForStep(fromDb)
  // Legacy user (null step) — never force into onboarding.
  if (opts.onboardingStep == null && opts.onboardingCompletedAt == null) {
    return "/dashboard"
  }
  if (opts.localStep) return routeForStep(opts.localStep)
  return "/dashboard"
}
