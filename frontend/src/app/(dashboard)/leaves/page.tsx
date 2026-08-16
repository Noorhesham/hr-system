"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { FormInput, DateRangePicker } from "@/components/form"
import { SiteHeader } from "@/components/site-header"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { LEAVE_STATUS_AR, formatDateAr } from "@/components/employees/types"
import {
  TablePagination,
  type PageMeta,
} from "@/components/table-pagination"
import { apiFetch } from "@/lib/api-client"
import {
  fetchEmployeeOption,
  fetchEmployeeOptions,
} from "@/lib/lazy-options"
import { usePermission } from "@/hooks/use-permission"
import { COMPANY_OWNER_ROLE, PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type LeaveItem = {
  id: string
  employeeId: string
  employeeName: string | null
  fromDate: string
  toDate: string
  days: number
  reason: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
}

function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const createSchema = z
  .object({
    employeeId: z.string().optional(),
    fromDate: z.string().min(1, "فترة الإجازة مطلوبة"),
    toDate: z.string().min(1, "فترة الإجازة مطلوبة"),
    reason: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const today = localYmd()
    if (v.fromDate && v.fromDate < today) {
      ctx.addIssue({
        code: "custom",
        message: "لا يمكن طلب إجازة قبل اليوم",
        path: ["fromDate"],
      })
    }
    if (v.fromDate && v.toDate && v.toDate < v.fromDate) {
      ctx.addIssue({
        code: "custom",
        message: "تاريخ النهاية يجب أن يكون بعد البداية أو نفسه",
        path: ["fromDate"],
      })
    }
  })

type CreateValues = z.infer<typeof createSchema>

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-primary/10 text-primary border-transparent",
  PENDING: "bg-orange-100 text-orange-700 border-transparent",
  REJECTED: "bg-destructive/10 text-destructive border-transparent",
}

export default function LeavesPage() {
  const { can, user } = usePermission()
  const isPortal = Boolean(user?.isPortalUser)
  const isOwner = user?.roleName === COMPANY_OWNER_ROLE
  const canCreateForOthers =
    !isPortal &&
    (isOwner ||
      can([PERMISSIONS.MANAGE_LEAVES, PERMISSIONS.APPROVE_LEAVES]))
  const canReviewLeave =
    !isPortal &&
    (can([PERMISSIONS.APPROVE_LEAVES, PERMISSIONS.MANAGE_LEAVES]) ||
      Boolean(user?.employeeId))

  const [rows, setRows] = React.useState<LeaveItem[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [status, setStatus] = React.useState<string>("ALL")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [cancelTarget, setCancelTarget] = React.useState<LeaveItem | null>(
    null,
  )
  const [saving, setSaving] = React.useState(false)
  const [actingId, setActingId] = React.useState<string | null>(null)

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      employeeId: "",
      fromDate: "",
      toDate: "",
      reason: "",
    },
  })

  React.useEffect(() => {
    setPage(1)
  }, [status, limit])

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
        const res = await apiFetch<{ data: LeaveItem[]; meta?: PageMeta }>(
          `/leaves?${params}`,
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
        toast.error(err instanceof Error ? err.message : "تعذر تحميل الإجازات")
        if (!opts?.silent) {
          setRows([])
          setMeta(null)
        }
      } finally {
        setInitialLoading(false)
      }
    },
    [status, page, limit],
  )

  React.useEffect(() => {
    void load()
  }, [load])

  function applyRowUpdate(updated: LeaveItem) {
    setRows((prev) => {
      if (status !== "ALL" && updated.status !== status) {
        return prev.filter((r) => r.id !== updated.id)
      }
      return prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    })
  }

  function openCreate() {
    if (!canCreateForOthers && !user?.employeeId) {
      toast.error("حسابك غير مرتبط بملف موظف")
      return
    }
    form.reset({
      employeeId: canCreateForOthers ? "" : (user?.employeeId ?? ""),
      fromDate: "",
      toDate: "",
      reason: "",
    })
    setCreateOpen(true)
  }

  async function onCreate(values: CreateValues) {
    if (canCreateForOthers && !values.employeeId) {
      form.setError("employeeId", { message: "الموظف مطلوب" })
      return
    }
    setSaving(true)
    try {
      const created = await apiFetch<LeaveItem>("/leaves", {
        method: "POST",
        body: {
          ...(canCreateForOthers ? { employeeId: values.employeeId } : {}),
          fromDate: values.fromDate,
          toDate: values.toDate,
          reason: values.reason?.trim() || undefined,
        },
      })
      toast.success("تم إنشاء طلب الإجازة")
      setCreateOpen(false)
      form.reset()
      if (status === "ALL" || status === "PENDING") {
        setRows((prev) => [created, ...prev])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الإنشاء")
    } finally {
      setSaving(false)
    }
  }

  async function approve(id: string) {
    setActingId(id)
    try {
      const updated = await apiFetch<LeaveItem>(`/leaves/${id}/approve`, {
        method: "PATCH",
        body: {},
      })
      toast.success("تمت الموافقة على الطلب")
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
      const updated = await apiFetch<LeaveItem>(`/leaves/${id}/reject`, {
        method: "PATCH",
        body: { reviewNote: "مرفوض من لوحة الإدارة" },
      })
      toast.success("تم رفض الطلب")
      applyRowUpdate(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الرفض")
    } finally {
      setActingId(null)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setActingId(cancelTarget.id)
    try {
      await apiFetch(`/leaves/${cancelTarget.id}`, { method: "DELETE" })
      toast.success("تم إلغاء الطلب")
      setRows((prev) => prev.filter((r) => r.id !== cancelTarget.id))
      setCancelTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الإلغاء")
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <SiteHeader
        title={isPortal ? "إجازاتي" : "الإجازات"}
        breadcrumbs={[isPortal ? "إجازاتي" : "الإجازات"]}
      />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-almarai text-2xl font-bold">
              {isPortal ? "إجازاتي" : "طلبات الإجازات"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPortal
                ? "قدّم طلب إجازة لنفسك وتابع حالته."
                : "إنشاء ومراجعة طلبات الإجازة مع موافقة المدير أو المالك."}
            </p>
          </div>
          <Button
            type="button"
            className="gap-2 rounded-lg"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" />
            طلب إجازة
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-9! w-44 rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === "ALL"
                    ? "كل الحالات"
                    : LEAVE_STATUS_AR[v] ?? v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              <SelectItem value="PENDING">قيد الانتظار</SelectItem>
              <SelectItem value="APPROVED">موافق عليها</SelectItem>
              <SelectItem value="REJECTED">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                {isPortal ? null : <TableHead>الموظف</TableHead>}
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>الأيام</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {isPortal ? null : (
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    )}
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isPortal ? 6 : 7}
                    className="h-28 text-center text-muted-foreground"
                  >
                    لا توجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const isOwn = r.employeeId === user?.employeeId
                  const showReview = canReviewLeave && !isOwn
                  const showCancel = isOwner || isOwn
                  return (
                  <TableRow key={r.id}>
                    {isPortal ? null : (
                      <TableCell className="font-medium">
                        {r.employeeName ?? "—"}
                      </TableCell>
                    )}
                    <TableCell>{formatDateAr(r.fromDate)}</TableCell>
                    <TableCell>{formatDateAr(r.toDate)}</TableCell>
                    <TableCell className="tabular-nums">{r.days}</TableCell>
                    <TableCell className="max-w-[12rem] truncate">
                      {r.reason ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2.5 font-medium",
                          STATUS_STYLE[r.status],
                        )}
                      >
                        {LEAVE_STATUS_AR[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          {showReview ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-lg"
                                disabled={actingId === r.id}
                                onClick={() => void approve(r.id)}
                              >
                                {actingId === r.id ? (
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
                                disabled={actingId === r.id}
                                onClick={() => void reject(r.id)}
                              >
                                رفض
                              </Button>
                            </>
                          ) : null}
                          {showCancel ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                            disabled={actingId === r.id}
                            onClick={() => setCancelTarget(r)}
                          >
                            إلغاء
                          </Button>
                          ) : null}
                          {!showReview && !showCancel ? "—" : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {meta && meta.pageCount > 0 ? (
            <TablePagination
              meta={meta}
              page={page}
              limit={limit}
              shownCount={rows.length}
              disabled={initialLoading}
              onPageChange={setPage}
              onLimitChange={(n) => {
                setLimit(n)
                setPage(1)
              }}
            />
          ) : null}
        </div>
      </div>

      <Dialog
        open={createOpen}
        disablePointerDismissal
        onOpenChange={(next, details) => {
          if (
            !next &&
            (details.reason === "outsidePress" || details.reason === "focusOut")
          ) {
            details.cancel()
            return
          }
          setCreateOpen(next)
        }}
      >
        <DialogContent className="overflow-visible sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>طلب إجازة جديد</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreate)}
              className="space-y-4"
              noValidate
            >
              {canCreateForOthers ? (
              <FormInput
                name="employeeId"
                label="الموظف"
                formType="combobox"
                required
                lazyQueryKey="leave-employees"
                lazyFetchFn={fetchEmployeeOptions}
                lazyFetchItemFn={fetchEmployeeOption}
                placeholder="اختر الموظف"
              />
              ) : null}
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FormItem className="w-full space-y-2.5">
                    <FormLabel>
                      <span>فترة الإجازة</span>
                      <span className="ms-0.5 text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DateRangePicker
                        from={field.value}
                        to={form.watch("toDate")}
                        min={localYmd()}
                        placeholder="اختر البداية والنهاية"
                        onChange={({ from, to }) => {
                          field.onChange(from)
                          form.setValue("toDate", to, { shouldValidate: true })
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormInput
                name="reason"
                label="السبب"
                formType="textarea"
                placeholder="اختياري"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
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

      <ConfirmDeleteDialog
        open={cancelTarget != null}
        onOpenChange={(open) => {
          if (!open && !actingId) setCancelTarget(null)
        }}
        title={
          cancelTarget
            ? isPortal
              ? "إلغاء طلب الإجازة؟"
              : `إلغاء طلب إجازة ${cancelTarget.employeeName ?? ""}؟`
            : "إلغاء طلب الإجازة؟"
        }
        description="سيتم إلغاء طلب الإجازة نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="إلغاء الطلب"
        loading={actingId === cancelTarget?.id}
        onConfirm={confirmCancel}
      />
    </>
  )
}
