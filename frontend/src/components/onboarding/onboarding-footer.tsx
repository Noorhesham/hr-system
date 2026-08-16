import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type OnboardingFooterProps = {
  onBack?: () => void
  onNext?: () => void
  onSkip?: () => void
  nextLabel?: string
  backLabel?: string
  skipLabel?: string
  nextDisabled?: boolean
  nextPending?: boolean
  nextType?: "button" | "submit"
  className?: string
}

/**
 * Shared bottom nav for steps 2-7: outline "السابق" on the visual right,
 * optional "تخطي" text link in the middle, primary "متابعة" on the visual left.
 * (DOM order = RTL visual order: back, skip, next.)
 */
export function OnboardingFooter({
  onBack,
  onNext,
  onSkip,
  nextLabel = "متابعة",
  backLabel = "السابق",
  skipLabel = "تخطي",
  nextDisabled = false,
  nextPending = false,
  nextType = "button",
  className,
}: OnboardingFooterProps) {
  return (
    <div
      className={cn(
        "mt-8 flex items-center justify-between gap-3 border-t border-border pt-6",
        className,
      )}
    >
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 rounded-[6px] px-8 font-semibold"
        >
          {backLabel}
        </Button>
      ) : (
        <span aria-hidden />
      )}

      <div className="flex items-center gap-4">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {skipLabel}
          </button>
        )}
        <Button
          type={nextType}
          onClick={nextType === "button" ? onNext : undefined}
          disabled={nextDisabled || nextPending}
          className="h-11 rounded-[6px] bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-[#c8c8c8] disabled:text-white disabled:opacity-100"
        >
          {nextPending ? "جارٍ الحفظ…" : nextLabel}
        </Button>
      </div>
    </div>
  )
}
