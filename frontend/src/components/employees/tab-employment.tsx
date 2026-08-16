"use client"

import Link from "next/link"

import {
  EMPLOYMENT_TYPE_AR,
  JOB_RANK_AR,
  SALARY_BASIS_AR,
  WORK_LOCATION_AR,
  formatDateAr,
  type EmployeeDetail,
} from "@/components/employees/types"
import { Button } from "@/components/ui/button"

type TabEmploymentProps = {
  employee: EmployeeDetail
}

export function TabEmployment({ employee }: TabEmploymentProps) {
  const fields: { label: string; value: string }[] = [
    { label: "القسم", value: employee.department ?? "—" },
    { label: "المسمى الوظيفي", value: employee.position ?? "—" },
    {
      label: "المدير المباشر",
      value: employee.managerName ?? "—",
    },
    {
      label: "نوع التوظيف",
      value: EMPLOYMENT_TYPE_AR[employee.employmentType] ?? employee.employmentType,
    },
    {
      label: "مدة العقد",
      value:
        employee.contractDurationYears != null
          ? `${employee.contractDurationYears} سنة`
          : "—",
    },
    {
      label: "مكان العمل",
      value: WORK_LOCATION_AR[employee.workLocation] ?? "—",
    },
    {
      label: "الرتبة الوظيفية",
      value: JOB_RANK_AR[employee.jobRank] ?? "—",
    },
    {
      label: "أساس الراتب",
      value: SALARY_BASIS_AR[employee.salaryBasis] ?? employee.salaryBasis,
    },
    { label: "الحالة", value: employee.isActive ? "نشط" : "غير نشط" },
    { label: "تاريخ التعيين", value: formatDateAr(employee.createdAt) },
    {
      label: "التأمينات (GOSI)",
      value: employee.isGosiRegistered
        ? employee.gosiNumber || "مسجّل"
        : "غير مسجّل",
    },
    { label: "الوردية", value: employee.shift?.name ?? "—" },
  ]

  return (
    <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgb(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-almarai text-lg font-bold">بيانات التوظيف</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          render={<Link href={`/employees/${employee.id}/edit`} />}
        >
          تعديل
        </Button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd className="text-sm font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
