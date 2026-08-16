import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"

/**
 * Shared auth shell: full viewport, no page scroll.
 * Equal 50/50 columns (brand right / form left in RTL).
 * 16px gap between the two sides.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex h-dvh max-h-dvh w-full gap-4 overflow-hidden bg-[#F5F5F5] p-6"
      dir="rtl"
    >
      {/* Right in RTL — 50% */}
      <AuthBrandPanel />

      {/* Left in RTL — 50% */}
      <main className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto rounded-[24px] bg-white lg:w-1/2">
        {children}
      </main>
    </div>
  )
}
