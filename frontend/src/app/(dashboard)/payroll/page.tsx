"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  BanIcon,
  CalculatorIcon,
  CalendarIcon,
  CheckIcon,
  DownloadIcon,
  EllipsisIcon,
  EyeIcon,
  FilterIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  WalletIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Combobox, FormInput } from "@/components/form"
import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TablePagination,
  type PageMeta,
} from "@/components/table-pagination"
import { apiFetch, getAccessToken } from "@/lib/api-client"
import { formatHoursDuration, formatMinutesDuration } from "@/lib/format-duration"
import {
  fetchDepartmentOption,
  fetchDepartmentOptions,
} from "@/lib/lazy-options"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type CycleStatus = "DRAFT" | "REVIEW" | "APPROVED" | "CLOSED"

type CycleTotals = {
  totalSalaries: number
  totalAllowances: number
  totalBonuses: number
  totalDeductions: number
  netSalaries: number
}

type Cycle = {
  id: string
  month: number
  year: number
  status: CycleStatus
  createdAt: string
  _count?: { payrollSlips?: number }
  totals?: CycleTotals
}

type SlipDetail = SlipRow & {
  payrollCycle: { id: string; month: number; year: number; status: CycleStatus }
  attendance: {
    present: number
    absent: number
    leave: number
    delayMinutes: number
    overtimeHours: number
  }
  attendanceDays: {
    date: string
    status: "PRESENT" | "ABSENT" | "LEAVE"
    delayMinutes: number
    overtimeHours: number
  }[]
  overtimeDays: {
    date: string
    hours: number
    clockHours: number
    requestHours: number
    source: "CLOCK" | "REQUEST"
    amount: number
  }[]
  leaves: {
    id: string
    fromDate: string
    toDate: string
    reason: string | null
  }[]
  loans: {
    amount: number | string
    dueDate: string
    status: string
  }[]
  components: {
    name: string
    type: "ALLOWANCE" | "DEDUCTION"
    amount: number | string
    isPercentage: boolean
  }[]
  breakdown: {
    componentDeductions: number | string
    absenceDeduction: number | string
    delayDeduction: number | string
    gosiEmployee: number | string
  } | null
}

const ATT_AR: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  LEAVE: "إجازة",
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

const STATUS_UI: Record<
  CycleStatus,
  { label: string; className: string; dot: string }
> = {
  DRAFT: {
    label: "مسودة",
    className: "bg-muted text-muted-foreground border-transparent",
    dot: "bg-muted-foreground",
  },
  REVIEW: {
    label: "قيد المراجعة",
    className: "bg-orange-100 text-orange-700 border-transparent",
    dot: "bg-orange-500",
  },
  APPROVED: {
    label: "معتمد",
    className: "bg-primary/10 text-primary border-transparent",
    dot: "bg-primary",
  },
  CLOSED: {
    label: "تم الصرف",
    className: "bg-sky-100 text-sky-700 border-transparent",
    dot: "bg-sky-500",
  },
}

const createSchema = z.object({
  month: z.string().min(1),
  year: z.string().min(1),
})

type CreateInput = z.input<typeof createSchema>
type CreateValues = z.output<typeof createSchema>

function n(v: number | string) {
  return typeof v === "string" ? Number(v) : v
}

function money(v: number | string) {
  return n(v).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function money2(v: number | string) {
  return n(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function arabicInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
  }
  return name.slice(0, 2) || "؟"
}

function cycleLabel(c: Pick<Cycle, "month" | "year">) {
  return `${MONTH_AR[c.month] ?? c.month} ${c.year}`
}

export default function PayrollPage() {
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.MANAGE_PAYROLL)
  const now = new Date()

  const [cycles, setCycles] = React.useState<Cycle[]>([])
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [selected, setSelected] = React.useState<Cycle | null>(null)
  const [rows, setRows] = React.useState<SlipRow[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [loadingCycles, setLoadingCycles] = React.useState(true)
  const [loadingSlips, setLoadingSlips] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const { search, setSearch, debouncedSearch } = useDebouncedSearch(300)
  const [department, setDepartment] = React.useState("ALL")
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [acting, setActing] = React.useState(false)
  const [detail, setDetail] = React.useState<SlipDetail | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [slipsTick, setSlipsTick] = React.useState(0)

  const form = useForm<CreateInput, unknown, CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    },
  })

  const loadCycles = React.useCallback(async () => {
    setLoadingCycles(true)
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        orderBy: "createdAt",
        order: "desc",
      })
      const res = await apiFetch<{ data: Cycle[] }>(`/payroll/cycles?${params}`)
      const list = res.data ?? []
      setCycles(list)
      setSelectedId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev
        return list[0]?.id ?? ""
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الدورات")
      setCycles([])
    } finally {
      setLoadingCycles(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCycles()
  }, [loadCycles])

  const visibleCycles = React.useMemo(() => {
    if (statusFilter === "ALL") return cycles
    return cycles.filter((c) => c.status === statusFilter)
  }, [cycles, statusFilter])

  React.useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    if (
      statusFilter !== "ALL" &&
      !visibleCycles.some((c) => c.id === selectedId)
    ) {
      setSelectedId(visibleCycles[0]?.id ?? "")
    }
  }, [statusFilter, selectedId, visibleCycles])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, department, selectedId, limit])

  React.useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      setRows([])
      setMeta(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const detail = await apiFetch<Cycle>(`/payroll/cycles/${selectedId}`)
        if (!cancelled) setSelected(detail)
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "تعذر فتح الدورة")
          setSelected(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  React.useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    ;(async () => {
      setLoadingSlips(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          orderBy: "name",
          order: "asc",
        })
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (department !== "ALL") params.set("departmentId", department)
        const res = await apiFetch<{ data: SlipRow[]; meta: PageMeta }>(
          `/payroll/cycles/${selectedId}/slips?${params}`,
        )
        if (!cancelled) {
          setRows(res.data ?? [])
          setMeta(res.meta ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "تعذر تحميل الكشف")
          setRows([])
          setMeta(null)
        }
      } finally {
        if (!cancelled) setLoadingSlips(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, page, limit, debouncedSearch, department, slipsTick])

  async function onCreate(values: CreateValues) {
    setSaving(true)
    try {
      const created = await apiFetch<Cycle>("/payroll/cycles", {
        method: "POST",
        body: {
          month: Number(values.month),
          year: Number(values.year),
        },
      })
      toast.success("تم إنشاء دورة الرواتب")
      setOpen(false)
      await loadCycles()
      setSelectedId(created.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الإنشاء")
    } finally {
      setSaving(false)
    }
  }

  async function act(path: string, label: string) {
    if (!selected) return
    setActing(true)
    try {
      await apiFetch(`/payroll/cycles/${selected.id}${path}`, {
        method: path.includes("recalculate") ? "POST" : "PATCH",
        body: {},
      })
      toast.success(label)
      const cycle = await apiFetch<Cycle>(`/payroll/cycles/${selected.id}`)
      setSelected(cycle)
      setCycles((prev) =>
        prev.map((c) => (c.id === cycle.id ? { ...c, status: cycle.status } : c)),
      )
      setSlipsTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تنفيذ الإجراء")
    } finally {
      setActing(false)
    }
  }

  async function downloadWps() {
    if (!selected) return
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3004/api"
      const token = getAccessToken()
      const res = await fetch(`${base}/payroll/cycles/${selected.id}/wps`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("تعذر تحميل ملف الكشف")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payroll-${selected.year}-${selected.month}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر التحميل")
    }
  }

  async function openSlip(id: string) {
    setDetailLoading(true)
    setDetail(null)
    try {
      const slip = await apiFetch<SlipDetail>(`/payroll/slips/${id}`)
      setDetail(slip)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر فتح القسيمة")
    } finally {
      setDetailLoading(false)
    }
  }

  const totals = selected?.totals
  const canDownload =
    selected?.status === "APPROVED" || selected?.status === "CLOSED"

  return (
    <>
      <SiteHeader
        title="إدارة الرواتب"
        breadcrumbs={[{ label: "الرواتب", href: "/payroll" }, { label: "إدارة الرواتب" }]}
      />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-almarai text-2xl font-bold tracking-tight">
                إدارة الرواتب
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                مراجعة واعتماد رواتب الموظفين وإدارة دورة الرواتب الشهرية
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage && selected?.status === "DRAFT" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg"
                    disabled={acting}
                    onClick={() => void act("/recalculate", "تمت إعادة الحساب")}
                  >
                    إعادة حساب
                  </Button>
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg"
                    disabled={acting}
                    onClick={() => void act("/review", "نُقلت للمراجعة")}
                  >
                    إرسال للمراجعة
                  </Button>
                </>
              ) : null}
              {canManage && selected?.status === "REVIEW" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg"
                    disabled={acting}
                    onClick={() =>
                      void act("/draft", "رُجعت للمسودة — عدّل المصدر ثم أعد الحساب")
                    }
                  >
                    إرجاع للمسودة
                  </Button>
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg"
                    disabled={acting}
                    onClick={() => void act("/approve", "تم الاعتماد")}
                  >
                    <CheckIcon className="size-4" />
                    اعتماد الرواتب
                  </Button>
                </>
              ) : null}
              {canManage && selected?.status === "APPROVED" ? (
                <Button
                  type="button"
                  className="h-10 gap-2 rounded-lg"
                  disabled={acting}
                  onClick={() => void act("/close", "تم الإغلاق")}
                >
                  <CheckIcon className="size-4" />
                  إغلاق الدورة
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg"
                disabled={!canDownload}
                onClick={() => void downloadWps()}
              >
                <DownloadIcon className="size-4" />
                تنزيل الكشف (Excel)
              </Button>
              {canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-lg"
                  onClick={() => setOpen(true)}
                >
                  <PlusIcon className="size-4" />
                  دورة جديدة
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="إجمالي الرواتب"
              value={totals ? `${money(totals.totalSalaries)} ر.س` : "—"}
              icon={<WalletIcon className="size-5" />}
              tone="green"
            />
            <KpiCard
              title="إجمالي الاستقطاعات"
              value={totals ? `${money(totals.totalDeductions)} ر.س` : "—"}
              icon={<BanIcon className="size-5" />}
              tone="red"
            />
            <KpiCard
              title="إجمالي المكافآت"
              value={totals ? `${money(totals.totalBonuses)} ر.س` : "—"}
              icon={<WalletIcon className="size-5" />}
              tone="mint"
            />
            <KpiCard
              title="صافي الرواتب"
              value={totals ? `${money(totals.netSalaries)} ر.س` : "—"}
              icon={<CalculatorIcon className="size-5" />}
              tone="blue"
            />
          </div>
        </div>

        <div className="sticky top-(--header-height) z-20 border-y border-border/70 bg-white/95 px-4 py-3 shadow-[0_1px_3px_rgb(0,0,0,0.04)] backdrop-blur-sm lg:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FilterIcon className="size-4" />
              تصفية
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative min-w-0 sm:max-w-xs sm:flex-1">
                <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن موظف"
                  className="h-9 rounded-lg pe-9"
                />
              </div>
              <Select
                value={selectedId || undefined}
                onValueChange={(v) => {
                  if (v) setSelectedId(v)
                }}
              >
                <SelectTrigger className="h-9! w-full rounded-lg sm:w-44">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <SelectValue>
                    {() =>
                      selected
                        ? cycleLabel(selected)
                        : loadingCycles
                          ? "جاري التحميل..."
                          : "اختر الدورة"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {visibleCycles.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      لا توجد دورات
                    </div>
                  ) : (
                    visibleCycles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {cycleLabel(c)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Combobox
                value={department === "ALL" ? "ALL" : department}
                onValueChange={(v) => setDepartment(v || "ALL")}
                queryKey="payroll-dept-filter"
                fetchFn={fetchDepartmentOptions}
                fetchItemFn={fetchDepartmentOption}
                leadingOptions={[{ value: "ALL", label: "جميع الأقسام" }]}
                placeholder="جميع الأقسام"
                searchPlaceholder="بحث عن قسم..."
                className="h-9! sm:w-44"
              />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  if (v !== null) setStatusFilter(v)
                }}
              >
                <SelectTrigger className="h-9! w-full rounded-lg sm:w-40">
                  <SelectValue>
                    {(value: string | null) => {
                      if (!value || value === "ALL") return "جميع الحالات"
                      return STATUS_UI[value as CycleStatus]?.label ?? value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  <SelectItem value="DRAFT">مسودة</SelectItem>
                  <SelectItem value="REVIEW">قيد المراجعة</SelectItem>
                  <SelectItem value="APPROVED">معتمد</SelectItem>
                  <SelectItem value="CLOSED">تم الصرف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 lg:px-6 lg:py-6">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">اسم الموظف</TableHead>
                  <TableHead>الرقم الوظيفي</TableHead>
                  <TableHead>الراتب الأساسي</TableHead>
                  <TableHead>البدلات</TableHead>
                  <TableHead>المكافآت</TableHead>
                  <TableHead>الاستقطاعات</TableHead>
                  <TableHead>صافي الراتب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCycles || loadingSlips ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j} className="px-4 py-3.5">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !selectedId ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-40 text-center text-muted-foreground"
                    >
                      لا توجد دورة رواتب. أنشئ دورة جديدة للبدء.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-40 text-center text-muted-foreground"
                    >
                      لا توجد قسائم مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const status = STATUS_UI[selected?.status ?? "DRAFT"]
                    const deductions =
                      n(row.totalDeductions) + n(row.loanDeductions)
                    return (
                      <TableRow key={row.id} className="hover:bg-muted/40">
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 bg-primary/10">
                              {row.employee.photoUrl ? (
                                <AvatarImage
                                  src={row.employee.photoUrl}
                                  alt={row.employee.name}
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {arabicInitials(row.employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {row.employee.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {row.employee.email ?? "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">
                          {row.employee.employeeCode}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {money(row.basicSalary)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {money(row.totalAllowances)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {money(row.overtimeBonus)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {money(deductions)}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {money(row.netSalary)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
                              status.className,
                            )}
                          >
                            <span
                              className={cn("size-1.5 rounded-full", status.dot)}
                            />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label="تفاصيل الراتب"
                              onClick={() => void openSlip(row.id)}
                            >
                              <EyeIcon className="size-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-muted-foreground"
                                    aria-label="المزيد"
                                  />
                                }
                              >
                                <EllipsisIcon className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-40">
                                <DropdownMenuItem
                                  onClick={() => void openSlip(row.id)}
                                >
                                  تفاصيل الراتب
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  render={
                                    <Link href={`/employees/${row.employee.id}`} />
                                  }
                                >
                                  ملف الموظف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            {meta && meta.itemCount > 0 ? (
              <TablePagination
                meta={meta}
                page={page}
                limit={limit}
                shownCount={rows.length}
                disabled={loadingSlips}
                limitOptions={[10, 20, 50]}
                showingLabel={(shown, total) => `نعرض ${shown} من أصل ${total}`}
                onPageChange={setPage}
                onLimitChange={(n) => {
                  setLimit(n)
                  setPage(1)
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        open={detailLoading || !!detail}
        onOpenChange={(next) => {
          if (!next) {
            setDetail(null)
            setDetailLoading(false)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detail?.employee.name ?? (detailLoading ? "جاري التحميل…" : "تفاصيل الراتب")}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && !detail ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : detail ? (
            <SlipBreakdown
              detail={detail}
              canManage={canManage}
              cycleStatus={selected?.status ?? detail.payrollCycle.status}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>دورة رواتب جديدة</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreate)}
              className="space-y-4"
              noValidate
            >
              <FormInput
                name="month"
                label="الشهر"
                formType="input"
                inputType="number"
                required
                min={1}
                max={12}
              />
              <FormInput
                name="year"
                label="السنة"
                formType="input"
                inputType="number"
                required
                min={2000}
                max={2100}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    "إنشاء"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PayLine({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: "plus" | "minus" | "net"
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <div>
        <p>{label}</p>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <p
        className={cn(
          "shrink-0 tabular-nums",
          tone === "plus" && "text-emerald-700",
          tone === "minus" && "text-red-600",
          tone === "net" && "font-almarai text-base font-bold",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function SlipBreakdown({
  detail,
  canManage,
  cycleStatus,
}: {
  detail: SlipDetail
  canManage: boolean
  cycleStatus: CycleStatus
}) {
  const b = detail.breakdown
  const days = detail.attendanceDays ?? []
  const otDays = detail.overtimeDays ?? []
  const leaves = detail.leaves ?? []
  const loans = detail.loans ?? []
  const tabClass =
    "flex-none rounded-none px-0 pb-2 text-muted-foreground after:bg-primary data-active:bg-transparent data-active:text-primary data-active:shadow-none"

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {detail.employee.employeeCode}
        {detail.employee.email ? ` · ${detail.employee.email}` : ""}
      </p>
      <Tabs defaultValue="summary" className="w-full gap-3">
        <TabsList
          variant="line"
          className="mb-0 h-auto w-full flex-wrap justify-start gap-4 rounded-none bg-transparent p-0"
        >
          <TabsTrigger value="summary" className={tabClass}>
            ملخص
          </TabsTrigger>
          <TabsTrigger value="attendance" className={tabClass}>
            حضور
          </TabsTrigger>
          <TabsTrigger value="overtime" className={tabClass}>
            إضافي
          </TabsTrigger>
          <TabsTrigger value="leaves" className={tabClass}>
            إجازات
          </TabsTrigger>
          <TabsTrigger value="pay" className={tabClass}>
            بدلات وخصومات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-1 space-y-3">
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm">
            حاضر {detail.attendance.present} · غائب {detail.attendance.absent} ·
            إجازة {detail.attendance.leave}
          </div>
          <div className="divide-y divide-border/60">
            <PayLine
              label="الراتب الأساسي"
              value={`${money2(detail.basicSalary)} ر.س`}
            />
            <PayLine
              label="البدلات"
              value={`+ ${money2(detail.totalAllowances)} ر.س`}
              tone="plus"
            />
            <PayLine
              label="أوفر تايم"
              value={`+ ${money2(detail.overtimeBonus)} ر.س`}
              tone="plus"
            />
            {b ? (
              <>
                <PayLine
                  label="خصم الغياب / الإجازة"
                  value={`− ${money2(b.absenceDeduction)} ر.س`}
                  tone="minus"
                />
                <PayLine
                  label="خصم التأخير"
                  value={`− ${money2(b.delayDeduction)} ر.س`}
                  tone="minus"
                />
                <PayLine
                  label="تأمينات"
                  value={`− ${money2(b.gosiEmployee)} ر.س`}
                  hint={
                    detail.employee.isGosiRegistered
                      ? undefined
                      : "غير مسجّل في التأمينات"
                  }
                  tone="minus"
                />
                <PayLine
                  label="خصومات أخرى"
                  value={`− ${money2(b.componentDeductions)} ر.س`}
                  tone="minus"
                />
              </>
            ) : null}
            <PayLine
              label="أقساط سلف"
              value={`− ${money2(detail.loanDeductions)} ر.س`}
              tone="minus"
            />
            <PayLine
              label="صافي الراتب"
              value={`${money2(detail.netSalary)} ر.س`}
              tone="net"
            />
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-1">
          {days.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد سجلات حضور في هذا الشهر
            </p>
          ) : (
            <div className="divide-y divide-border/60 text-sm">
              {days.map((d) => (
                <div
                  key={d.date}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <p className="tabular-nums">{d.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {ATT_AR[d.status] ?? d.status}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    تأخير {formatMinutesDuration(d.delayMinutes)} · إضافي{" "}
                    {formatHoursDuration(d.overtimeHours)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overtime" className="mt-1">
          {otDays.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا يوجد أوفر تايم مدفوع هذا الشهر
            </p>
          ) : (
            <div className="divide-y divide-border/60 text-sm">
              {otDays.map((d) => (
                <div
                  key={d.date}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div>
                    <p className="tabular-nums">{d.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.source === "REQUEST" ? "من طلب معتمد" : "من البصمة"}
                      {d.clockHours > 0 && d.requestHours > 0
                        ? ` · بصمة ${formatHoursDuration(d.clockHours)} / طلب ${formatHoursDuration(d.requestHours)}`
                        : ""}
                    </p>
                  </div>
                  <p className="tabular-nums">
                    {formatHoursDuration(d.hours)} · {money2(d.amount)} ر.س
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaves" className="mt-1">
          {leaves.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد إجازات معتمدة في هذا الشهر
            </p>
          ) : (
            <div className="divide-y divide-border/60 text-sm">
              {leaves.map((l) => (
                <div key={l.id} className="py-2">
                  <p className="tabular-nums">
                    {l.fromDate} – {l.toDate}
                  </p>
                  {l.reason ? (
                    <p className="text-xs text-muted-foreground">{l.reason}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pay" className="mt-1 space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              البدلات
            </p>
            {detail.components.filter((c) => c.type === "ALLOWANCE").length ===
            0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بدلات</p>
            ) : (
              detail.components
                .filter((c) => c.type === "ALLOWANCE")
                .map((c) => (
                  <PayLine
                    key={c.name}
                    label={c.name}
                    value={
                      c.isPercentage
                        ? `${n(c.amount)}٪`
                        : `${money2(c.amount)} ر.س`
                    }
                    tone="plus"
                  />
                ))
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              خصومات ثابتة
            </p>
            {detail.components.filter((c) => c.type === "DEDUCTION").length ===
            0 ? (
              <p className="text-sm text-muted-foreground">لا توجد خصومات</p>
            ) : (
              detail.components
                .filter((c) => c.type === "DEDUCTION")
                .map((c) => (
                  <PayLine
                    key={c.name}
                    label={c.name}
                    value={
                      c.isPercentage
                        ? `${n(c.amount)}٪`
                        : `${money2(c.amount)} ر.س`
                    }
                    tone="minus"
                  />
                ))
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              أقساط هذا الشهر
            </p>
            {loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد أقساط</p>
            ) : (
              loans.map((l, i) => (
                <PayLine
                  key={`${l.dueDate}-${i}`}
                  label={`قسط ${l.dueDate}`}
                  value={`${money2(l.amount)} ر.س`}
                  hint={l.status}
                  tone="minus"
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        الرقم نتيجة حساب. عدّل الحضور أو الإجازة أو الطلب أو السلفة، وبعدين من
        المسودة اضغط إعادة حساب.
      </p>
      <DialogFooter className="gap-2 sm:justify-start">
        <Button
          type="button"
          variant="outline"
          render={<Link href={`/employees/${detail.employeeId}`} />}
        >
          ملف الموظف
        </Button>
        {canManage && cycleStatus === "DRAFT" ? (
          <Button
            type="button"
            variant="outline"
            render={<Link href="/attendance" />}
          >
            تعديل الحضور
          </Button>
        ) : null}
      </DialogFooter>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string
  value: string
  icon: React.ReactNode
  tone: "green" | "red" | "mint" | "blue"
}) {
  const tones = {
    green: "bg-primary/10 text-primary",
    red: "bg-red-50 text-red-600",
    mint: "bg-emerald-50 text-emerald-600",
    blue: "bg-sky-50 text-sky-600",
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white p-4 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 font-almarai text-xl font-bold tabular-nums">
          {value}
        </p>
      </div>
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          tones[tone],
        )}
      >
        {icon}
      </div>
    </div>
  )
}
