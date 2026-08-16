"use client"

import { OnboardingGuard } from "@/components/onboarding/onboarding-guard"

/**
 * Full-page shell for the onboarding wizard — no sidebar/header, just a
 * centered card over a faint primary-green grid (distinct from the split
 * brand-panel layout used by `(auth)`).
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-y-auto bg-white px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-onboarding-grid"
      />
      <div className="relative z-10 w-full">
        <OnboardingGuard>{children}</OnboardingGuard>
      </div>
    </div>
  )
}
