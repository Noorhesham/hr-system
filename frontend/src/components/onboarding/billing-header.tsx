"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type BillingHeaderProps = {
  backHref: string
  backLabel?: string
  className?: string
}

/**
 * Compact header for pricing/payment screens (logo end / back start) —
 * distinct from OnboardingShell's progress bar.
 */
export function BillingHeader({
  backHref,
  backLabel = "العودة",
  className,
}: BillingHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex w-full items-center justify-between",
        className,
      )}
    >
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="size-4" aria-hidden />
        {backLabel}
      </Link>
      <Image
        src="/logo.png"
        alt="نجاز"
        width={88}
        height={56}
        priority
        className="h-10 w-auto object-contain"
      />
    </header>
  )
}
