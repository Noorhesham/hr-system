"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function AuthBackLink({
  href = "/login",
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary",
        className,
      )}
    >
      <ChevronRight className="size-4" aria-hidden />
      العودة
    </Link>
  )
}

export function AuthFormShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col justify-center px-6 py-10 lg:px-12",
        className,
      )}
    >
      {children}
    </div>
  )
}
