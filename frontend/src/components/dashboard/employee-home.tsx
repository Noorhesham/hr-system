"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarDaysIcon,
  CalendarCheckIcon,
  ClockIcon,
  InboxIcon,
  LogInIcon,
  LogOutIcon,
  WalletIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"
import { formatMinutesDuration } from "@/lib/format-duration"
import { formatTime12h } from "@/lib/format-time"
import { formatDateAr } from "@/components/employees/types"
import { arabicInitials, formatSar } from "@/components/dashboard/types"
import { cn } from "@/lib/utils"

export type EmployeeHomePayload = {
  employee: {
    id: string
    name: string
    department: string | null
    position: string | null
    photoUrl: string | null
    shift: { id: string; name: string; startTime: string; endTime: string } | null
  }
  today: {
    date: string
    status: "PRESENT" | "ABSENT" | "LEAVE" | null
    checkIn: string | null
    checkOut: string | null
    delayMinutes: number
  }
  month: { present: number; late: number; absent: number; leave: number }
  latestPayslip: {
    id: string
    netSalary: number | string
    basicSalary: number | string
    month: number
    year: number
  } | null
  pendingLeaves: number
  pendingRequests: number
  recentLeaves: {
    id: string
    fromDate: string
    toDate: string
    status: string
    reason: string | null
  }[]
  recentRequests: {
    id: string
    type: string
    title: string | null
    status: string
    date: string | null
  }[]
}

const MONTH_AR = [
  "",
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
]

const LEAVE_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "موافق عليها",
  REJECTED: "مرفوضة",
}

const REQUEST_AR: Record<string, string> = {
  PENDING: "بانتظار المدير",
  IN_REVIEW: "بانتظار الموارد البشرية",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
}

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-primary/10 text-primary border-transparent",
  PENDING: "bg-orange-100 text-orange-700 border-transparent",
  IN_REVIEW: "bg-sky-100 text-sky-700 border-transparent",
  REJECTED: "bg-destructive/10 text-destructive border-transparent",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
}


function n(v: number | string) {
  return typeof v === "string" ? Number(v) : v
}

export function EmployeeHomeDashboard({
  data,
  onRefresh,
}: {
  data: EmployeeHomePayload
  onRefresh: () => void
}) {
  const [punching, setPunching] = React.useState<"in" | "out" | null>(null)
  const { employee, today, month, latestPayslip } = data
  const canCheckIn = !today.checkIn && today.status !== "LEAVE"
  const canCheckOut = Boolean(today.checkIn) && !today.checkOut

  async function punch(kind: "in" | "out") {
    setPunching(kind)
    try {
      await apiFetch(`/attendance/check-${kind === "in" ? "in" : "out"}`, {
        method: "POST",
        body: {},
      })
      toast.success(kind === "in" ? "تم تسجيل الحضور" : "تم تسجيل الانصراف")
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تسجيل البصمة")
    } finally {
      setPunching(null)
    }
  }

  const todayLabel =
    today.status === "LEAVE"
      ? "أنت في إجازة اليوم"
      : today.checkIn && today.checkOut
        ? "اكتمل يوم العمل"
        : today.checkIn
          ? "أنت حاضر الآن"
          : "لم يتم تسجيل الحضور بعد"

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/80 py-0 shadow-[0_1px_3px_rgb(0,0,0,0.04)] lg:col-span-2">
          <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">حضور اليوم</p>
              <h3 className="mt-1 font-almarai text-xl font-bold">{todayLabel}</h3>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">الحضور: </span>
                  <span className="font-medium tabular-nums">
                    {formatTime12h(today.checkIn)}
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">الانصراف: </span>
                  <span className="font-medium tabular-nums">
                    {formatTime12h(today.checkOut)}
                  </span>
                </span>
                {today.delayMinutes > 0 ? (
                  <span className="text-orange-600">
                    تأخير {formatMinutesDuration(today.delayMinutes)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                className="h-10 gap-2 rounded-lg"
                disabled={!canCheckIn || punching !== null}
                onClick={() => void punch("in")}
              >
                <LogInIcon className="size-4" />
                {punching === "in" ? "جاري التسجيل..." : "تسجيل حضور"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg"
                disabled={!canCheckOut || punching !== null}
                onClick={() => void punch("out")}
              >
                <LogOutIcon className="size-4" />
                {punching === "out" ? "جاري التسجيل..." : "تسجيل انصراف"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 py-0 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <CardContent className="flex items-center gap-3 p-5">
            <Avatar className="size-14 bg-primary/10">
              {employee.photoUrl ? (
                <AvatarImage src={employee.photoUrl} alt={employee.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                {arabicInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-almarai text-base font-bold">
                {employee.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {employee.position ?? "موظف"}
                {employee.department ? ` · ${employee.department}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {employee.shift
                  ? `${employee.shift.name} · ${formatTime12h(employee.shift.startTime)} – ${formatTime12h(employee.shift.endTime)}`
                  : "لا توجد وردية معيّنة"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          title="حضور هذا الشهر"
          value={`${month.present + month.late} يوم`}
          hint={`${month.late} تأخير · ${month.absent} غياب`}
          icon={ClockIcon}
          iconClass="bg-violet-100 text-violet-700"
        />
        <Kpi
          title="آخر قسيمة راتب"
          value={
            latestPayslip ? formatSar(n(latestPayslip.netSalary)) : "—"
          }
          hint={
            latestPayslip
              ? `${MONTH_AR[latestPayslip.month]} ${latestPayslip.year}`
              : "لا توجد قسيمة معتمدة"
          }
          icon={WalletIcon}
          iconClass="bg-emerald-100 text-emerald-700"
        />
        <Kpi
          title="إجازات معلّقة"
          value={String(data.pendingLeaves)}
          hint="بانتظار الاعتماد"
          icon={CalendarDaysIcon}
          iconClass="bg-orange-100 text-orange-600"
        />
        <Kpi
          title="طلباتي المفتوحة"
          value={String(data.pendingRequests)}
          hint="بانتظار المدير أو الموارد البشرية"
          icon={InboxIcon}
          iconClass="bg-sky-100 text-sky-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)] lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="font-almarai text-base">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink href="/leaves" icon={CalendarDaysIcon} label="طلب إجازة" />
              <QuickLink href="/my-requests" icon={InboxIcon} label="تقديم طلب" />
              <QuickLink
                href="/attendance"
                icon={CalendarCheckIcon}
                label="سجل الحضور"
              />
              <QuickLink href="/leaves" icon={ClockIcon} label="إجازاتي" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <CardHeader className="pb-2">
            <CardTitle className="font-almarai text-base">آخر الإجازات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentLeaves.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد طلبات إجازة
              </p>
            ) : (
              data.recentLeaves.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {formatDateAr(row.fromDate)} – {formatDateAr(row.toDate)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.reason || "بدون سبب"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full",
                      STATUS_STYLE[row.status] ?? "",
                    )}
                  >
                    {LEAVE_AR[row.status] ?? row.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <CardHeader className="pb-2">
            <CardTitle className="font-almarai text-base">آخر الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentRequests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد طلبات
              </p>
            ) : (
              data.recentRequests.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.title || (row.type === "OVERTIME" ? "عمل إضافي" : "طلب عام")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.date ? formatDateAr(row.date) : "—"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full",
                      STATUS_STYLE[row.status] ?? "",
                    )}
                  >
                    {REQUEST_AR[row.status] ?? row.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Kpi({
  title,
  value,
  hint,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  iconClass: string
}) {
  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-almarai text-2xl font-bold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            iconClass,
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-5 text-center text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      {label}
    </Link>
  )
}
