import { cn } from "@/lib/utils"

export const ONBOARDING_TOTAL_STEPS = 7

/** Best-effort percent-complete per step, read off the reference screenshots. */
export const ONBOARDING_STEP_PERCENT: Record<number, number> = {
  1: 10,
  2: 28,
  3: 43,
  4: 57,
  5: 65,
  6: 75,
  7: 90,
}

type OnboardingShellProps = {
  step: number
  percent?: number
  children: React.ReactNode
  className?: string
}

/**
 * Card + step/progress header shared by every onboarding screen.
 * RTL note: first DOM child renders on the visual right, so "الخطوة x من y"
 * comes before the percent label to match the reference layout.
 */
export function OnboardingShell({
  step,
  percent,
  children,
  className,
}: OnboardingShellProps) {
  const value = percent ?? ONBOARDING_STEP_PERCENT[step] ?? 0

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[792px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-10",
        className,
      )}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-foreground">
            الخطوة {step} من {ONBOARDING_TOTAL_STEPS}
          </span>
          <span className="font-bold text-primary">{value}% مكتمل</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}
