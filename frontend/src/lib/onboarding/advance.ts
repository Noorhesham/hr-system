import { apiFetch } from "@/lib/api-client"
import {
  setLocalOnboardingStep,
  type OnboardingRouteStep,
} from "@/lib/onboarding/draft"
import {
  routeToDbStep,
  type DbOnboardingStep,
} from "@/lib/onboarding/steps"

/**
 * Persist the next wizard high-water-mark to the DB + localStorage.
 * Call after a successful save on a post-auth step, before navigating.
 *
 * Pass `refreshSession` so AuthProvider picks up the new onboardingStep —
 * otherwise OnboardingGuard still sees the stale JWT user and bounces you
 * back to the previous step.
 */
export async function advanceOnboardingTo(
  next: OnboardingRouteStep,
  refreshSession?: () => Promise<void>,
) {
  const dbStep = routeToDbStep(next)
  if (dbStep) {
    await apiFetch<{ step: DbOnboardingStep | null; completedAt: string | null }>(
      "/onboarding/state",
      { method: "PATCH", body: { step: dbStep } },
    )
  }
  setLocalOnboardingStep(next)
  if (refreshSession) {
    await refreshSession()
  }
}
