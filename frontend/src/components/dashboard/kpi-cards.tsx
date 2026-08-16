"use client"

import {
  UsersIcon,
  WalletIcon,
  ClockIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
  formatPct,
  formatSar,
  type DashboardPayload,
} from "@/components/dashboard/types"
import { cn } from "@/lib/utils"

type KpiCardsProps = {
  data: DashboardPayload
}

export function DashboardKpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: "إجمالي الموظفين",
      value: data.totalEmployees.toLocaleString("en-US"),
      delta: `+${data.employeesDeltaMonth} خلال الفترة`,
      positive: true,
      icon: UsersIcon,
      iconClass: "bg-sky-100 text-sky-600",
    },
    {
      title: "رواتب هذه الدورة",
      value: formatSar(data.currentCyclePayroll),
      delta: data.previousCycleLabel
        ? `${data.payrollDeltaPct >= 0 ? "+" : ""}${data.payrollDeltaPct}% مقارنة ب${data.previousCycleLabel}`
        : "لا توجد دورة سابقة",
      positive: data.payrollDeltaPct >= 0,
      icon: WalletIcon,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "نسبة الحضور",
      value: formatPct(data.attendanceRate),
      delta: `${data.attendanceRateDeltaWeek >= 0 ? "+" : ""}${data.attendanceRateDeltaWeek}% مقارنة بالشهر السابق`,
      positive: data.attendanceRateDeltaWeek >= 0,
      icon: ClockIcon,
      iconClass: "bg-violet-100 text-violet-700",
    },
    {
      title: "طلبات إجازة معلقة",
      value: data.pendingLeaveRequests.toLocaleString("en-US"),
      delta: `+${Math.max(0, data.pendingLeaveRequestsDelta)} بحاجة للمراجعة`,
      positive: true,
      icon: CalendarDaysIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        const Trend = c.positive ? TrendingUpIcon : TrendingDownIcon
        return (
          <Card
            key={c.title}
            className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]"
          >
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="font-almarai text-2xl font-bold tracking-tight">
                  {c.value}
                </p>
                <p
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    c.positive ? "text-primary" : "text-destructive",
                  )}
                >
                  <Trend className="size-3.5 shrink-0" />
                  <span className="truncate">{c.delta}</span>
                </p>
              </div>
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  c.iconClass,
                )}
              >
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
