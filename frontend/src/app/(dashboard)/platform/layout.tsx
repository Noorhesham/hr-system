"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && !user?.isPlatformAdmin) {
      router.replace("/dashboard")
    }
  }, [status, user, router])

  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user?.isPlatformAdmin) return null

  return <>{children}</>
}
