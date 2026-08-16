"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getLocalOnboardingStep,
  setLocalOnboardingStep,
  type OnboardingRouteStep,
} from "@/lib/onboarding/draft"
import {
  dbStepToRoute,
  groupIndex,
  isPostAuthStep,
  isPreAuthStep,
  routeForStep,
  routeStepFromPathname,
  stepIndex,
} from "@/lib/onboarding/steps"

/**
 * Highest post-auth step the user is allowed to open.
 * Uses max(DB step from auth, localStorage) so a just-saved advance that
 * hasn't refreshed the JWT yet doesn't bounce the user back.
 * Compared by groupIndex so pricing ↔ payment stay same gate.
 */
function allowedPostAuthStep(
  dbRoute: OnboardingRouteStep | null,
  local: OnboardingRouteStep | null,
): OnboardingRouteStep | null {
  const candidates = [dbRoute, local].filter(
    (s): s is OnboardingRouteStep => !!s && isPostAuthStep(s),
  )
  if (!candidates.length) return null
  return candidates.reduce((best, s) =>
    groupIndex(s) > groupIndex(best) ? s : best,
  )
}

/**
 * Guards onboarding routes:
 * - Finished users → always /dashboard (no revisiting /onboarding/*).
 * - Blocks jumping ahead of the saved high-water-mark (by step group).
 * - Allows navigating back to earlier steps while still in progress.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    if (status === "loading") return

    // Completed onboarding → never stay under /onboarding/*
    if (
      status === "authenticated" &&
      user?.onboardingCompletedAt &&
      pathname.startsWith("/onboarding")
    ) {
      router.replace("/dashboard")
      return
    }

    const current = routeStepFromPathname(pathname)
    if (!current) {
      setReady(true)
      return
    }

    const local = getLocalOnboardingStep()

    // Persist pre-auth local high-water-mark as the user walks forward.
    if (isPreAuthStep(current)) {
      if (!local || stepIndex(current) >= stepIndex(local)) {
        setLocalOnboardingStep(current)
      }
    }

    if (status === "authenticated" && user) {
      const dbRoute = dbStepToRoute(user.onboardingStep)
      // Active onboarding owner (step set, not completed).
      if (user.onboardingStep != null && dbRoute) {
        const allowed = allowedPostAuthStep(dbRoute, local) ?? dbRoute

        if (isPreAuthStep(current)) {
          router.replace(routeForStep(allowed))
          return
        }
        // Block jumping ahead of the effective high-water-mark (by group).
        if (groupIndex(current) > groupIndex(allowed)) {
          router.replace(routeForStep(allowed))
          return
        }
        setReady(true)
        return
      }

      // Legacy authenticated user with no onboarding — leave pre-auth alone,
      // but don't let them hang on post-auth onboarding pages.
      if (isPostAuthStep(current)) {
        router.replace("/dashboard")
        return
      }
      setReady(true)
      return
    }

    // Unauthenticated
    if (isPostAuthStep(current)) {
      router.replace(routeForStep("welcome"))
      return
    }

    // Pre-auth: block jumping ahead of local draft progress.
    const localStep = getLocalOnboardingStep() ?? "welcome"
    if (stepIndex(current) > stepIndex(localStep) + 1) {
      router.replace(routeForStep(localStep))
      return
    }

    setReady(true)
  }, [status, user, pathname, router])

  if (status === "loading" || !ready) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return <>{children}</>
}
