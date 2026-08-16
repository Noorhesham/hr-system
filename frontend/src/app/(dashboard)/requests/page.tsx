"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateAr } from "@/components/employees/types"
import {
  TablePagination,
  type PageMeta,
} from "@/components/table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api-client"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type RequestItem = {
  id: string
  type: "OVERTIME" | "GENERAL"
  title: string | null
  reason: string | null
  date: string | null
  hours: number | null
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED"
  approvalLevel: number
  employeeName: string | null
}

const STATUS_AR: Record<string, string> = {
  PENDING: "بانتظار المدير",
  IN_REVIEW: "بانتظار الموارد البشرية",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
}

const TYPE_AR: Record<string, string> = {
  OVERTIME: "عمل إضافي",
  GENERAL: "طلب عام",
}

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-primary/10 text-primary border-transparent",
  PENDING: "bg-orange-100 text-orange-700 border-transparent",
  IN_REVIEW: "bg-sky-100 text-sky-700 border-transparent",
  REJECTED: "bg-destructive/10 text-destructive border-transparent",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
}

export default function RequestsInboxPage() {
  const { can, user } = usePermission()
  const canApprove =
    can([PERMISSIONS.APPROVE_REQUESTS, PERMISSIONS.MANAGE_REQUESTS]) ||
    Boolean(user?.employeeId)

  const [rows, setRows] = React.useState<RequestItem[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [status, setStatus] = React.useState("PENDING")
  const [type, setType] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [actingId, setActingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setPage(1)
  }, [status, type, limit])

  const load = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setInitialLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          order: "desc",
        })
        if (status !== "ALL") params.set("status", status)
        if (type !== "ALL") params.set("type", type)
        const res = await apiFetch<{ data: RequestItem[]; meta?: PageMeta }>(
          `/requests?${params}`,
        )
        setRows(res.data ?? [])
        setMeta(
          res.meta ?? {
            page,
            limit,
            itemCount: res.data?.length ?? 0,
            pageCount: 1,
            hasPreviousPage: page > 1,
            hasNextPage: false,
          },
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر تحميل الطلبات")
        if (!opts?.silent) {
          setRows([])
          setMeta(null)
        }
      } finally {
        setInitialLoading(false)
      }
    },
    [status, type, page, limit],
  )

  React.useEffect(() => {
    void load()
  }, [load])

  function applyRowUpdate(updated: RequestItem) {
    setRows((prev) => {
      if (status !== "ALL" && updated.status !== status) {
        return prev.filter((r) => r.id !== updated.id)
      }
      return prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    })
  }

  async function approve(id: string) {
    setActingId(id)
    try {
      const updated = await apiFetch<RequestItem>(`/requests/${id}/approve`, {
        method: "PATCH",
        body: {},
      })
      toast.success(
        updated.status === "APPROVED"
          ? "تمت الموافقة النهائية"
          : "تمت الموافقة — بانتظار المستوى التالي",
      )
      applyRowUpdate(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الموافقة")
    } finally {
      setActingId(null)
    }
  }

  async function reject(id: string) {
    setActingId(id)
    try {
      const updated = await apiFetch<RequestItem>(`/requests/${id}/reject`, {
        method: "PATCH",
        body: { reviewNote: "مرفوض من صندوق الطلبات" },
      })
      toast.success("تم رفض الطلب")
      applyRowUpdate(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الرفض")
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <SiteHeader title="الطلبات" breadcrumbs={["الطلبات"]} />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-almarai text-2xl font-bold">صندوق الطلبات</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              مراجعة طلبات العمل الإضافي والطلبات العامة (مستويان: مدير ثم
              موارد بشرية).{" "}
              <Link href="/leaves" className="text-primary underline-offset-2 hover:underline">
                طلبات الإجازات
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-9! w-48 rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === "ALL" ? "كل الحالات" : (STATUS_AR[v] ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              <SelectItem value="PENDING">بانتظار المدير</SelectItem>
              <SelectItem value="IN_REVIEW">بانتظار الموارد البشرية</SelectItem>
              <SelectItem value="APPROVED">موافق عليه</SelectItem>
              <SelectItem value="REJECTED">مرفوض</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger className="h-9! w-40 rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === "ALL" ? "كل الأنواع" : (TYPE_AR[v] ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الأنواع</SelectItem>
              <SelectItem value="OVERTIME">عمل إضافي</SelectItem>
              <SelectItem value="GENERAL">طلب عام</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>الموظف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    لا توجد طلبات في هذا الفلتر
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const actionable =
                    canApprove &&
                    (row.status === "PENDING" || row.status === "IN_REVIEW")
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.employeeName || "—"}
                      </TableCell>
                      <TableCell>{TYPE_AR[row.type]}</TableCell>
                      <TableCell>
                        {row.type === "OVERTIME" ? (
                          <span className="text-sm">
                            {row.date ? formatDateAr(row.date) : "—"} ·{" "}
                            {row.hours ?? "—"} ساعة
                          </span>
                        ) : (
                          <span className="text-sm">{row.title || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(STATUS_STYLE[row.status])}
                        >
                          {STATUS_AR[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {actionable ? (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-lg"
                              disabled={actingId === row.id}
                              onClick={() => void approve(row.id)}
                            >
                              {actingId === row.id ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                              ) : (
                                "موافقة"
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-destructive"
                              disabled={actingId === row.id}
                              onClick={() => void reject(row.id)}
                            >
                              رفض
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          {meta ? (
            <TablePagination
              meta={meta}
              page={page}
              limit={limit}
              shownCount={rows.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
