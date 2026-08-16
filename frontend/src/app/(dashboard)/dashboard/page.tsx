"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { SiteHeader } from "@/components/site-header"
import { DashboardAttendanceDonut } from "@/components/dashboard/attendance-donut"
import { DashboardDepartmentBars } from "@/components/dashboard/department-bars"
import { DashboardKpiCards } from "@/components/dashboard/kpi-cards"
import { DashboardLeaveList } from "@/components/dashboard/leave-list"
import { DashboardQuickActions } from "@/components/dashboard/quick-actions"
import { DashboardSalaryChart } from "@/components/dashboard/salary-chart"
import {
  EmployeeHomeDashboard,
  type EmployeeHomePayload,
} from "@/components/dashboard/employee-home"
import {
  formatPeriodLabelAr,
  lastToCurrentMonthRange,
  type DashboardPayload,
} from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

function greetingForHour(hour: number): string {
  if (hour < 12) return "صباح الخير"
  if (hour < 17) return "مساء الخير"
  return "مساء الخير"
}

function formatTodayAr(d: Date): string {
  return d.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const { user, status } = useAuth()
  const isPortal = Boolean(user?.isPortalUser)
  const [data, setData] = React.useState<DashboardPayload | null>(null)
  const [home, setHome] = React.useState<EmployeeHomePayload | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [reloadToken, setReloadToken] = React.useState(0)
  const range = React.useMemo(() => lastToCurrentMonthRange(), [])

  React.useEffect(() => {
    if (status !== "authenticated" || !user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        if (user.isPortalUser) {
          const res = await apiFetch<EmployeeHomePayload>("/ess/home")
          if (!cancelled) {
            setHome(res)
            setData(null)
          }
        } else {
          const params = new URLSearchParams({
            from: range.from,
            to: range.to,
          })
          const res = await apiFetch<DashboardPayload>(
            `/reports/dashboard?${params}`,
          )
          if (!cancelled) {
            setData(res)
            setHome(null)
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "تعذر تحميل لوحة التحكم",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, user, range.from, range.to, reloadToken])

  const firstName =
    user?.fullName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "مستخدم"
  const now = new Date()
  const periodLabel = data?.period
    ? formatPeriodLabelAr(data.period)
    : null

  return (
    <>
      <SiteHeader title="لوحة التحكم" />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-almarai text-xl font-bold sm:text-2xl">
                {greetingForHour(now.getHours())}، {firstName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                إليك آخر المستجدات اليوم، {formatTodayAr(now)}.
              </p>
            </div>
            {isPortal ? null : (
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 rounded-lg bg-white"
              title={`${range.from} → ${range.to}`}
            >
              <CalendarIcon className="size-4" />
              {periodLabel ? (
                <span className="text-sm">{periodLabel}</span>
              ) : (
                <Skeleton className="h-4 w-28" />
              )}
            </Button>
            )}
          </div>

          {loading ? (
            <DashboardSkeleton />
          ) : isPortal && home ? (
            <EmployeeHomeDashboard
              data={home}
              onRefresh={() => setReloadToken((t) => t + 1)}
            />
          ) : data ? (
            <>
              <DashboardKpiCards data={data} />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="xl:col-span-3">
                  <DashboardSalaryChart
                    data={data.salarySummary}
                    periodLabel={periodLabel}
                  />
                </div>
                <div className="xl:col-span-2">
                  <DashboardDepartmentBars
                    data={data.employeesByDepartment}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <DashboardAttendanceDonut data={data.attendanceToday} />
                <DashboardLeaveList data={data.recentLeaveRequests} />
                <DashboardQuickActions />
              </div>
            </>
          ) : (
            <DashboardSkeleton />
          )}
        </div>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl xl:col-span-3" />
        <Skeleton className="h-72 rounded-2xl xl:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
