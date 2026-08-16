/**
 * Client-side draft bag for the onboarding wizard.
 * Text fields + logoUrl persist in localStorage across refreshes / devices
 * (same browser). Binary CSV lives in-memory only.
 */

const DRAFT_KEY = "najaz_onboarding_draft"
const STEP_KEY = "najaz_onboarding_step"

export type CompanyDraft = {
  companyName: string
  website: string
  industry: string
  /** Cloudinary URL once uploaded (or data URL preview until upload). */
  logoUrl?: string
}

export type AdminDraft = {
  fullName: string
  jobTitle: string
  email: string
  phone: string
}

export type AttendanceDraft = {
  workDays: string[]
  startTime: string
  endTime: string
  graceMinutes: string
  shiftId?: string
}

export type PayrollDraft = {
  currency: string
  cycle: string
  payoutDay: string
  directDeposit: boolean
}

export type BenefitsDraft = {
  provider: string
  tier: string
  gosiEnabled: boolean
  benefits: Record<string, boolean>
  housingAmount?: string
  housingIsPercentage?: boolean
  transportAmount?: string
  annualTicketsAmount?: string
}

export type OnboardingDraft = {
  company?: CompanyDraft
  admin?: AdminDraft
  attendance?: AttendanceDraft
  payroll?: PayrollDraft
  benefits?: BenefitsDraft
  registered?: boolean
}

/** Route slug used by the multi-page wizard. */
export type OnboardingRouteStep =
  | "welcome"
  | "company-profile"
  | "admin-account"
  | "pricing"
  | "payment"
  | "attendance"
  | "payroll"
  | "benefits"
  | "employees"
  | "complete"

export type SelectedPlanDraft = {
  planId: string
  billingCycle: "MONTHLY" | "ANNUAL"
  planName?: string
  monthlyPrice?: number
  maxEmployees?: number
}

/** Response snapshot from POST /company/subscribe (success or failure context). */
export type SubscriptionResultDraft = {
  view: "success" | "failed"
  subscriptionNumber?: string
  invoiceNumber?: string
  planId?: string
  planName?: string
  billingCycle?: "MONTHLY" | "ANNUAL"
  subtotal?: number
  discountApplied?: number
  promoCode?: string | null
  amount?: number
  currency?: string
  paidAt?: string
  nextBillingDate?: string
  status?: string
  maxEmployees?: number
  cardHolderName?: string
  errorMessage?: string
}

const SELECTED_PLAN_KEY = "najaz_onboarding_selected_plan"
const LAST_SUB_KEY = "najaz_onboarding_last_subscription"

let employeesCsvFile: File | null = null

function readDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {}
  } catch {
    return {}
  }
}

function writeDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function getOnboardingDraft(): OnboardingDraft {
  return readDraft()
}

export function patchOnboardingDraft(partial: Partial<OnboardingDraft>) {
  writeDraft({ ...readDraft(), ...partial })
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return
  localStorage.removeItem(DRAFT_KEY)
  localStorage.removeItem(STEP_KEY)
  sessionStorage.removeItem(SELECTED_PLAN_KEY)
  sessionStorage.removeItem(LAST_SUB_KEY)
  employeesCsvFile = null
}

export function setSelectedPlan(plan: SelectedPlanDraft) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SELECTED_PLAN_KEY, JSON.stringify(plan))
}

export function getSelectedPlan(): SelectedPlanDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SELECTED_PLAN_KEY)
    return raw ? (JSON.parse(raw) as SelectedPlanDraft) : null
  } catch {
    return null
  }
}

export function setLastSubscription(result: SubscriptionResultDraft) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(LAST_SUB_KEY, JSON.stringify(result))
}

export function getLastSubscription(): SubscriptionResultDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(LAST_SUB_KEY)
    return raw ? (JSON.parse(raw) as SubscriptionResultDraft) : null
  } catch {
    return null
  }
}

export function clearLastSubscription() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(LAST_SUB_KEY)
}

export function getLocalOnboardingStep(): OnboardingRouteStep | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STEP_KEY)
  return (raw as OnboardingRouteStep | null) ?? null
}

export function setLocalOnboardingStep(step: OnboardingRouteStep) {
  if (typeof window === "undefined") return
  localStorage.setItem(STEP_KEY, step)
}

export function setOnboardingEmployeesCsv(file: File | null) {
  employeesCsvFile = file
}

export function getOnboardingEmployeesCsv(): File | null {
  return employeesCsvFile
}

/** Invert selected work days → weekend list expected by CompanyPolicy. */
export function workDaysToWeekendDays(workDays: string[]): string[] {
  const map: Record<string, string> = {
    sun: "SUNDAY",
    mon: "MONDAY",
    tue: "TUESDAY",
    wed: "WEDNESDAY",
    thu: "THURSDAY",
    fri: "FRIDAY",
    sat: "SATURDAY",
  }
  const all = Object.keys(map)
  return all
    .filter((d) => !workDays.includes(d))
    .map((d) => map[d]!)
}

export function cycleToApi(cycle: string): string {
  if (cycle === "weekly") return "WEEKLY"
  if (cycle === "biweekly") return "BIWEEKLY"
  return "MONTHLY"
}
