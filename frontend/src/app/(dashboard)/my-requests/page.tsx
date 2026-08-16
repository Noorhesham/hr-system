"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { FormInput } from "@/components/form"
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
import { Form } from "@/components/ui/form"
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

const createSchema = z
  .object({
    type: z.enum(["OVERTIME", "GENERAL"]),
    title: z.string().optional(),
    reason: z.string().optional(),
    date: z.string().optional(),
    hours: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "GENERAL" && !v.title?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "عنوان الطلب مطلوب",
        path: ["title"],
      })
    }
    if (v.type === "OVERTIME") {
      if (!v.date) {
        ctx.addIssue({
          code: "custom",
          message: "التاريخ مطلوب",
          path: ["date"],
        })
      }
      const h = Number(v.hours)
      if (!v.hours || Number.isNaN(h) || h < 0.5) {
        ctx.addIssue({
          code: "custom",
          message: "الساعات مطلوبة (0.5 فأكثر)",
          path: ["hours"],
        })
      }
    }
  })

type CreateValues = z.infer<typeof createSchema>

export default function MyRequestsPage() {
  const [rows, setRows] = React.useState<RequestItem[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [status, setStatus] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [cancelTarget, setCancelTarget] = React.useState<RequestItem | null>(
    null,
  )
  const [saving, setSaving] = React.useState(false)
  const [actingId, setActingId] = React.useState<string | null>(null)

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      type: "OVERTIME",
      title: "",
      reason: "",
      date: "",
      hours: "",
    },
  })

  const watchType = form.watch("type")

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
          mine: "1",
        })
        if (status !== "ALL") params.set("status", status)
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
    [status, page, limit],
  )

  React.useEffect(() => {
    void load()
  }, [load])

  async function onCreate(values: CreateValues) {
    setSaving(true)
    try {
      await apiFetch("/requests", {
        method: "POST",
        body: {
          type: values.type,
          title:
            values.type === "GENERAL" ? values.title?.trim() : undefined,
          reason: values.reason?.trim() || undefined,
          date: values.type === "OVERTIME" ? values.date : undefined,
          hours:
            values.type === "OVERTIME" ? Number(values.hours) : undefined,
        },
      })
      toast.success("تم إرسال الطلب")
      setCreateOpen(false)
      form.reset({
        type: "OVERTIME",
        title: "",
        reason: "",
        date: "",
        hours: "",
      })
      void load({ silent: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الإرسال")
    } finally {
      setSaving(false)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setActingId(cancelTarget.id)
    try {
      await apiFetch(`/requests/${cancelTarget.id}`, { method: "DELETE" })
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
      <SiteHeader title="طلباتي" breadcrumbs={["طلباتي"]} />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-almarai text-2xl font-bold">طلباتي</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              قدّم طلب عمل إضافي أو طلباً عاماً وتابع حالة الموافقة.
            </p>
          </div>
          <Button
            type="button"
            className="gap-2 rounded-lg"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-4" />
            طلب جديد
          </Button>
        </div>

        <div className="flex items-center gap-3">
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
              {Object.entries(STATUS_AR).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>النوع</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المستوى</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
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
                    لا توجد طلبات بعد
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {TYPE_AR[row.type]}
                    </TableCell>
                    <TableCell>
                      {row.type === "OVERTIME" ? (
                        <span className="text-sm">
                          {row.date ? formatDateAr(row.date) : "—"} ·{" "}
                          {row.hours ?? "—"} ساعة
                        </span>
                      ) : (
                        <span className="text-sm">{row.title || "—"}</span>
                      )}
                      {row.reason ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {row.reason}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(STATUS_STYLE[row.status])}
                      >
                        {STATUS_AR[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.approvalLevel}
                    </TableCell>
                    <TableCell>
                      {row.status === "PENDING" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={actingId === row.id}
                          onClick={() => setCancelTarget(row)}
                        >
                          إلغاء
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>طلب جديد</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(onCreate)}
            >
              <FormInput
                name="type"
                label="نوع الطلب"
                formType="select"
                options={[
                  { value: "OVERTIME", label: "عمل إضافي" },
                  { value: "GENERAL", label: "طلب عام" },
                ]}
              />
              {watchType === "GENERAL" ? (
                <FormInput
                  name="title"
                  label="العنوان"
                  placeholder="مثال: طلب شهادة خبرة"
                />
              ) : (
                <>
                  <FormInput
                    name="date"
                    label="تاريخ العمل الإضافي"
                    formType="datepicker"
                  />
                  <FormInput
                    name="hours"
                    label="عدد الساعات"
                    inputType="number"
                    placeholder="2"
                  />
                </>
              )}
              <FormInput
                name="reason"
                label="السبب (اختياري)"
                formType="textarea"
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
                    "إرسال"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="إلغاء الطلب؟"
        description="سيتم إلغاء الطلب المعلّق ولن يمكن استرجاعه."
        onConfirm={confirmCancel}
        confirmLabel="إلغاء الطلب"
        loading={Boolean(actingId)}
      />
    </>
  )
}
