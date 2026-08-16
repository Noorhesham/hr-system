/**
 * Fixed RTL class helpers for form fields.
 * App is Arabic-only (dir="rtl" on <html>), so no locale switching.
 */
export function formRtlClasses() {
  return {
    isRTL: true,
    itemDir: "rtl" as const,
    label: "flex w-full flex-row items-center justify-start gap-1 text-sm font-medium text-foreground",
    requiredMark: "text-destructive",
    input: "text-start",
    // Eye on visual left (inline-end in RTL) — matches auth Figma
    passwordInput: "pe-10",
    passwordToggle:
      "absolute end-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:pointer-events-none",
    affixRow: "flex w-full items-center gap-2",
    message: "text-start",
  }
}
