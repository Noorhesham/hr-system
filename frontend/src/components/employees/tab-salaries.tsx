"use client"

import * as React from "react"
import Image from "next/image"
import {
  CalendarIcon,
  DownloadIcon,
  BanknoteIcon,
  WalletIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  SALARY_BASIS_AR,
  formatDateAr,
  type PayrollSlipRow,
} from "@/components/employees/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

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

function yearFilterLabel(value: string | null, currentYear: number): string {
  if (!value || value === "current") return "هذا العام"
  if (value === "all") return "كل السنوات"
  if (value === String(currentYear)) return "هذا العام"
  return value
}

type SarTone = "gray" | "green" | "red"

function SarAmount({
  amount,
  tone = "gray",
  signed = false,
  className,
}: {
  amount: number
  tone?: SarTone
  /** Prefix + / − for allowances / deductions. */
  signed?: boolean
  className?: string
}) {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })
  let prefix = ""
  if (signed && amount > 0) prefix = "+"
  if (signed && amount < 0) prefix = "−"
  if (signed && tone === "red" && amount > 0) prefix = "−"

  const src =
    tone === "green"
      ? "/green.svg"
      : tone === "red"
        ? "/red.svg"
        : "/gray.svg"

  const colorClass =
    tone === "green"
      ? "text-[#1F9120]"
      : tone === "red"
        ? "text-[#E51A1A]"
        : "text-foreground"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 tabular-nums",
        colorClass,
        className,
      )}
      dir="ltr"
    >
      <Image src={src} alt="" width={11} height={12} className="shrink-0" />
      <span>
        {prefix}
        {formatted}
      </span>
    </span>
  )
}

type TabSalariesProps = {
  slips: PayrollSlipRow[]
  loading?: boolean
  salaryBasis?: "MONTHLY" | "DAILY" | "HOURLY"
}

export function TabSalaries({
  slips,
  loading,
  salaryBasis = "MONTHLY",
}: TabSalariesProps) {
  const currentYear = new Date().getFullYear()
  const years = React.useMemo(() => {
    const set = new Set(slips.map((s) => s.year))
    set.add(currentYear)
    return [...set].sort((a, b) => b - a)
  }, [slips, currentYear])

  const [yearFilter, setYearFilter] = React.useState<string>("current")

  async function downloadSlip(id: string, month: number, year: number) {
    try {
      const slip = await apiFetch<{
        basicSalary: number | string
        totalAllowances: number | string
        overtimeBonus: number | string
        totalDeductions: number | string
        loanDeductions: number | string
        netSalary: number | string
        employee?: { name: string }
      }>(`/payroll/slips/${id}`)
      const lines = [
        `قسيمة راتب ${month}/${year}`,
        `الموظف: ${slip.employee?.name ?? ""}`,
        `الأساسي: ${slip.basicSalary}`,
        `البدلات: ${slip.totalAllowances}`,
        `إضافي: ${slip.overtimeBonus}`,
        `خصومات: ${slip.totalDeductions}`,
        `سلف: ${slip.loanDeductions}`,
        `صافي: ${slip.netSalary}`,
      ]
      const blob = new Blob([lines.join("\n")], {
        type: "text/plain;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payslip-${year}-${month}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("تم تحميل القسيمة")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر التحميل")
    }
  }

  const filtered = React.useMemo(() => {
    if (yearFilter === "all") return slips
    const y = yearFilter === "current" ? currentYear : Number(yearFilter)
    return slips.filter((s) => s.year === y)
  }, [slips, yearFilter, currentYear])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  const latest = slips[0]
  const annualSalary = latest
    ? Math.round(
        salaryBasis === "MONTHLY"
          ? latest.netSalary * 12
          : slips
              .filter((s) => s.year === (latest.year ?? currentYear))
              .reduce((sum, s) => sum + s.netSalary, 0),
      )
    : 0

  const cycleLabel =
    salaryBasis === "MONTHLY"
      ? "شهريًا"
      : salaryBasis === "DAILY"
        ? "يوميًا"
        : salaryBasis === "HOURLY"
          ? "ساعيًا"
          : (SALARY_BASIS_AR[salaryBasis] ?? salaryBasis)

  const cards = [
    {
      label: "دورة الراتب",
      value: cycleLabel,
      icon: BanknoteIcon,
      iconClass: "bg-sky-100 text-sky-600",
      isMoney: false,
    },
    {
      label: "الراتب السنوي",
      value: annualSalary,
      icon: WalletIcon,
      iconClass: "bg-primary/10 text-primary",
      isMoney: true,
    },
    {
      label: "آخر صرف للراتب",
      value: latest ? formatDateAr(latest.paidAt) : "—",
      icon: CalendarIcon,
      iconClass: "bg-violet-100 text-violet-600",
      isMoney: false,
    },
  ] as const

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => {
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
              <div className="mt-3 font-almarai text-2xl font-bold tracking-tight">
                {c.isMoney ? (
                  <SarAmount amount={c.value as number} tone="gray" />
                ) : (
                  <span>{c.value as string}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-almarai text-base font-bold">
            سجل مسيرات الرواتب
          </h3>
          <Select
            value={yearFilter}
            onValueChange={(v) => {
              if (v !== null) setYearFilter(v)
            }}
          >
            <SelectTrigger
              className={cn(
                "h-9! w-full min-w-[9.5rem] rounded-lg border-primary/40 bg-white ps-2.5 sm:w-auto",
                "text-sm font-medium text-foreground shadow-none",
                "hover:bg-white focus-visible:border-primary focus-visible:ring-primary/20",
              )}
            >
              <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue className="flex-none">
                  {(value: string | null) => yearFilterLabel(value, currentYear)}
                </SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[10rem]">
              <SelectItem value="current">
                هذا العام ({currentYear})
              </SelectItem>
              <SelectItem value="all">كل السنوات</SelectItem>
              {years
                .filter((y) => y !== currentYear)
                .map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>الفترة</TableHead>
              <TableHead>إجمالي الراتب</TableHead>
              <TableHead>الخصومات</TableHead>
              <TableHead>الزيادات</TableHead>
              <TableHead>صافي الراتب</TableHead>
              <TableHead>مسير الراتب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-28 text-center text-muted-foreground"
                >
                  لا توجد كشوف رواتب لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const deductions = s.totalDeductions
                const additions = s.totalAllowances + s.overtimeBonus
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {MONTH_AR[s.month] ?? s.month} {s.year}
                    </TableCell>
                    <TableCell>
                      <SarAmount amount={s.gross} tone="gray" />
                    </TableCell>
                    <TableCell>
                      {deductions > 0 ? (
                        <SarAmount
                          amount={deductions}
                          tone="red"
                          signed
                        />
                      ) : (
                        <SarAmount amount={0} tone="gray" />
                      )}
                    </TableCell>
                    <TableCell>
                      {additions > 0 ? (
                        <SarAmount
                          amount={additions}
                          tone="green"
                          signed
                        />
                      ) : (
                        <SarAmount amount={0} tone="gray" />
                      )}
                    </TableCell>
                    <TableCell>
                      <SarAmount amount={s.netSalary} tone="gray" />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2 text-[#1F9120] hover:bg-primary/5 hover:text-[#1F9120]"
                        onClick={() => void downloadSlip(s.id, s.month, s.year)}
                      >
                        <DownloadIcon className="size-4" />
                        تحميل
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
