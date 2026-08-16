"use client"

import * as React from "react"

import EmployeeProfilePage from "./employee-profile-page"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteHeader } from "@/components/site-header"

function RouteSkeleton() {
  return (
    <>
      <SiteHeader title="ملف الموظف" breadcrumbs={["الموظفون"]} />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  )
}

export default function EmployeeProfileRoute() {
  return (
    <React.Suspense fallback={<RouteSkeleton />}>
      <EmployeeProfilePage />
    </React.Suspense>
  )
}
