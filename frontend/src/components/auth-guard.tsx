"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { resumeRouteForUser } from "@/lib/onboarding/steps"
import { getLocalOnboardingStep } from "@/lib/onboarding/draft"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }
    if (status === "authenticated" && user) {
      // Lock dashboard until onboarding is finished.
      if (user.onboardingStep != null && !user.onboardingCompletedAt) {
        router.replace(
          resumeRouteForUser({
            onboardingStep: user.onboardingStep,
            onboardingCompletedAt: user.onboardingCompletedAt,
            localStep: getLocalOnboardingStep(),
          }),
        )
      }
    }
  }, [status, user, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-svh flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (status !== "authenticated") {
    return null
  }

  if (user?.onboardingStep != null && !user.onboardingCompletedAt) {
    return null
  }

  return <>{children}</>
}
