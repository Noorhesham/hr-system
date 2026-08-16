"use client"

import * as React from "react"
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  Clock3Icon,
  MapPinIcon,
} from "lucide-react"

import { DatePicker } from "@/components/form"
import {
  type AttendanceRow,
  type AttendanceSummary,
} from "@/components/employees/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { formatHoursDuration, formatMinutesDuration } from "@/lib/format-duration"
import { formatTime12h } from "@/lib/format-time"
import { cn } from "@/lib/utils"

type AttendancePage = {
  data: AttendanceRow[]
  summary: AttendanceSummary
  meta: {
    page: number
    limit: number
    itemCount: number
    pageCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

type StatusFilter = "ALL" | "PRESENT" | "LATE" | "ABSENT" | "LEAVE"

function ymString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number)
  const d = new Date(y!, m! - 1 + delta, 1)
  return ymString(d)
}

function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number)
  const lastDay = new Date(y!, m!, 0).getDate()
  return {
    from: `${y}-${String(m).padStart(2, "0")}-01`,
    to: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  }
}

function formatRangeLabel(from: string, to: string): string {
  const a = new Date(from + "T12:00:00")
  const b = new Date(to + "T12:00:00")
  const sameYear = a.getFullYear() === b.getFullYear()
  const left = a.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  })
  const right = b.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return `${left} – ${right}`
}

function dateIso(iso: string): string {
  return iso.slice(0, 10)
}

function weekdayAr(iso: string): string {
  return new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(
    new Date(iso),
  )
}

function rowMatchesStatus(r: AttendanceRow, filter: StatusFilter): boolean {
  if (filter === "ALL") return true
  if (filter === "LATE") return r.status === "PRESENT" && r.isLate
  if (filter === "PRESENT") return r.status === "PRESENT" && !r.isLate
  return r.status === filter
}

function statusUi(r: AttendanceRow): {
  label: string
  className: string
  dot: string
} {
  // Mock labels present rows as «نشط» with primary green badge.
  if (r.status === "PRESENT" && r.isLate) {
    return {
      label: "متأخر",
      className: "bg-orange-100 text-orange-700 border-transparent",
      dot: "bg-orange-500",
    }
  }
  if (r.status === "PRESENT") {
    return {
      label: "نشط",
      className: "bg-primary/10 text-primary border-transparent",
      dot: "bg-primary",
    }
  }
  if (r.status === "ABSENT") {
    return {
      label: "غائب",
      className: "bg-destructive/10 text-destructive border-transparent",
      dot: "bg-destructive",
    }
  }
  return {
    label: "إجازة",
    className: "bg-orange-100 text-orange-700 border-transparent",
    dot: "bg-orange-500",
  }
}

type TabAttendanceProps = {
  employeeId: string
}

export function TabAttendance({ employeeId }: TabAttendanceProps) {
  const initial = monthRange(ymString(new Date()))
  const [from, setFrom] = React.useState(initial.from)
  const [to, setTo] = React.useState(initial.to)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [loading, setLoading] = React.useState(true)
  const [rows, setRows] = React.useState<AttendanceRow[]>([])
  const [summary, setSummary] = React.useState<AttendanceSummary>({
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    remote: 0,
  })
  const [meta, setMeta] = React.useState<AttendancePage["meta"] | null>(null)
  const autoFallbackDone = React.useRef(false)

  React.useEffect(() => {
    setPage(1)
  }, [from, to, limit, statusFilter])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          from,
          to,
          order: "desc",
        })
        const res = await apiFetch<AttendancePage>(
          `/employees/${employeeId}/attendance?${params}`,
        )
        if (cancelled) return

        const empty =
          res.meta.itemCount === 0 &&
          res.summary.present +
            res.summary.late +
            res.summary.absent +
            res.summary.leave ===
            0

        if (empty && page === 1 && !autoFallbackDone.current) {
          autoFallbackDone.current = true
          const prev = monthRange(shiftMonth(ymString(new Date(from)), -1))
          if (prev.from !== from) {
            setFrom(prev.from)
            setTo(prev.to)
            return
          }
        }

        setRows(res.data)
        setSummary(res.summary)
        setMeta(res.meta)
      } catch {
        if (!cancelled) {
          setRows([])
          setSummary({
            present: 0,
            late: 0,
            absent: 0,
            leave: 0,
            remote: 0,
          })
          setMeta(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [employeeId, from, to, page, limit])

  const visibleRows = rows.filter((r) => rowMatchesStatus(r, statusFilter))

  const cards = [
    {
      label: "حاضر",
      value: summary.present,
      icon: CheckCircle2Icon,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "عمل عن بعد",
      value: summary.remote,
      icon: MapPinIcon,
      iconClass: "bg-sky-100 text-sky-600",
    },
    {
      label: "متأخر",
      value: summary.late,
      icon: Clock3Icon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "غائب",
      value: summary.absent,
      icon: AlertCircleIcon,
      iconClass: "bg-destructive/10 text-destructive",
    },
  ]

  const pageCount = meta?.pageCount ?? 1
  const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
    if (pageCount <= 5) return i + 1
    const start = Math.max(1, Math.min(page - 2, pageCount - 4))
    return start + i
  })

  const showingCount =
    statusFilter === "ALL" ? (rows.length ?? 0) : visibleRows.length
  const totalCount =
    statusFilter === "ALL" ? (meta?.itemCount ?? 0) : visibleRows.length

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : cards.map((c) => {
              const Icon = c.icon
              return (
                <div
                  key={c.label}
                  className="rounded-2xl border border-border/80 bg-white p-4 shadow-[0_1px_3px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <span
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-full",
                        c.iconClass,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="font-almarai text-3xl font-bold tabular-nums tracking-tight">
                      {c.value}
                    </p>
                    <span className="text-sm text-muted-foreground">أيام</span>
                  </div>
                </div>
              )
            })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">تصفية</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 rounded-lg border-primary/40 bg-white px-3 font-normal"
                  />
                }
              >
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="whitespace-nowrap text-sm font-medium">
                  {formatRangeLabel(from, to)}
                </span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto gap-3 p-3">
                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">من</label>
                  <DatePicker
                    value={from}
                    className="h-9"
                    placeholder="من تاريخ"
                    onChange={(v) => {
                      autoFallbackDone.current = true
                      setFrom(v)
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">إلى</label>
                  <DatePicker
                    value={to}
                    className="h-9"
                    placeholder="إلى تاريخ"
                    onChange={(v) => {
                      autoFallbackDone.current = true
                      setTo(v)
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                if (v) setStatusFilter(v as StatusFilter)
              }}
            >
              <SelectTrigger className="h-9! w-full rounded-lg border-border bg-white sm:w-44">
                <SelectValue>
                  {(value: string | null) => {
                    if (!value || value === "ALL") return "جميع الحالات"
                    if (value === "PRESENT") return "حاضر"
                    if (value === "LATE") return "متأخر"
                    if (value === "ABSENT") return "غائب"
                    if (value === "LEAVE") return "إجازة"
                    return value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الحالات</SelectItem>
                <SelectItem value="PRESENT">حاضر</SelectItem>
                <SelectItem value="LATE">متأخر</SelectItem>
                <SelectItem value="ABSENT">غائب</SelectItem>
                <SelectItem value="LEAVE">إجازة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>التاريخ</TableHead>
              <TableHead>اليوم</TableHead>
              <TableHead>وقت الدخول</TableHead>
              <TableHead>وقت الخروج</TableHead>
              <TableHead>ساعات العمل</TableHead>
              <TableHead>التأخير</TableHead>
              <TableHead>العمل الإضافي</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-28 text-center text-muted-foreground"
                >
                  لا توجد سجلات حضور لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((r) => {
                const st = statusUi(r)
                const ot = r.overtimeHours ?? 0
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium tabular-nums">
                      {dateIso(r.date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {weekdayAr(r.date)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTime12h(r.checkIn)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTime12h(r.checkOut)}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {r.workHours ?? "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular-nums font-medium",
                        r.delayMinutes > 0
                          ? "text-[#E51A1A]"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatMinutesDuration(r.delayMinutes)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular-nums font-medium",
                        ot > 0 ? "text-[#1F9120]" : "text-muted-foreground",
                      )}
                    >
                      {formatHoursDuration(ot)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
                          st.className,
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", st.dot)}
                        />
                        {st.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              نعرض {showingCount} من أصل {totalCount}
            </span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                if (v) setLimit(Number(v))
              }}
            >
              <SelectTrigger className="h-8! w-16 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-md"
              disabled={!meta?.hasPreviousPage || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            {pages.map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="size-8 rounded-md p-0"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-md"
              disabled={!meta?.hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
