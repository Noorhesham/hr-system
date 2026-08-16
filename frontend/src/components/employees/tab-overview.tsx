"use client"

import {
  Clock3Icon,
  FileTextIcon,
  UsersIcon,
} from "lucide-react"

import {
  EMPLOYMENT_TYPE_AR,
  JOB_RANK_AR,
  SALARY_BASIS_AR,
  WORK_LOCATION_AR,
  formatDateAr,
  serviceYearsExact,
  type EmployeeDetail,
  type LeaveRow,
  type PayrollSlipRow,
} from "@/components/employees/types"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

type TabOverviewProps = {
  employee: EmployeeDetail
  leaves: LeaveRow[]
  slips?: PayrollSlipRow[]
}

const ANNUAL_LEAVE_DAYS = 21

const CONTRACT_AR: Record<string, string> = {
  PERMANENT: "دوام كامل",
  CONTRACT: "عقد محدد",
  TEMPORARY: "مؤقت",
  PROBATION: "تحت التجربة",
}

type ActivityItem = {
  id: string
  title: string
  date: string
}

function buildActivity(
  employee: EmployeeDetail,
  leaves: LeaveRow[],
  slips: PayrollSlipRow[],
): ActivityItem[] {
  const items: ActivityItem[] = []

  items.push({
    id: `updated-${employee.id}`,
    title: "تم تحديث الملف الشخصي",
    date: employee.updatedAt ?? employee.createdAt,
  })

  const latestSlip = slips[0]
  if (latestSlip) {
    items.push({
      id: `slip-${latestSlip.id}`,
      title: "تم إنشاء كشف الرواتب",
      date: latestSlip.paidAt,
    })
  }

  const approvedLeave = leaves.find((l) => l.status === "APPROVED")
  if (approvedLeave) {
    items.push({
      id: `leave-${approvedLeave.id}`,
      title: "تمت الموافقة على طلب الإجازة",
      date: approvedLeave.fromDate,
    })
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
}

export function TabOverview({
  employee,
  leaves,
  slips = [],
}: TabOverviewProps) {
  const { user } = useAuth()
  const managerName =
    employee.managerName?.trim() ||
    user?.fullName?.trim() ||
    user?.email?.split("@")[0] ||
    "—"

  const year = new Date().getFullYear()
  const approvedDaysThisYear = leaves
    .filter(
      (l) =>
        l.status === "APPROVED" &&
        new Date(l.fromDate).getFullYear() === year,
    )
    .reduce((sum, l) => sum + l.days, 0)
  const leaveBalance = Math.max(0, ANNUAL_LEAVE_DAYS - approvedDaysThisYear)
  const yearsExact = serviceYearsExact(employee.createdAt)
  const activity = buildActivity(employee, leaves, slips)

  const kpis = [
    {
      label: "مدة الخدمة",
      value: yearsExact.toFixed(1),
      unit: "سنوات",
      icon: Clock3Icon,
      iconClass: "bg-sky-100 text-sky-600",
    },
    {
      label: "رصيد الإجازات",
      value: String(leaveBalance),
      unit: "أيام",
      icon: FileTextIcon,
      iconClass: "bg-primary/10 text-primary",
      hint: `متبقي من ${ANNUAL_LEAVE_DAYS} يومًا سنويًا`,
    },
    {
      label: "المرؤوسون المباشرون",
      value: "0",
      unit: null as string | null,
      icon: UsersIcon,
      iconClass: "bg-violet-100 text-violet-600",
      hint: "هذا الموظف لا يشرف على أحد حالياً",
    },
  ]

  const employmentFields = [
    { label: "المدير المباشر", value: managerName },
    {
      label: "المسمى الوظيفي",
      value: employee.position ?? "—",
    },
    {
      label: "الرتبة الوظيفية",
      value: JOB_RANK_AR[employee.jobRank] ?? "—",
    },
    {
      label: "نوع العقد",
      value:
        CONTRACT_AR[employee.employmentType] ??
        EMPLOYMENT_TYPE_AR[employee.employmentType] ??
        employee.employmentType,
    },
    {
      label: "تاريخ التعيين",
      value: formatDateAr(employee.hireDate ?? employee.createdAt),
    },
    {
      label: "مكان العمل",
      value: WORK_LOCATION_AR[employee.workLocation] ?? "—",
    },
    {
      label: "دورة الراتب",
      value: SALARY_BASIS_AR[employee.salaryBasis] ?? employee.salaryBasis,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg",
                    c.iconClass,
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="font-almarai text-3xl font-bold tracking-tight tabular-nums">
                  {c.value}
                </p>
                {c.unit ? (
                  <span className="text-sm text-muted-foreground">{c.unit}</span>
                ) : null}
              </div>
              {c.hint ? (
                <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgb(0,0,0,0.04)] lg:col-span-3">
          <h3 className="font-almarai text-base font-bold">
            نظرة عامة على التوظيف
          </h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {employmentFields.map((f) => (
              <div key={f.label} className="space-y-1">
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgb(0,0,0,0.04)] lg:col-span-2">
          <h3 className="font-almarai text-base font-bold">النشاط الأخير</h3>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              لا يوجد نشاط مسجّل بعد
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateAr(a.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
