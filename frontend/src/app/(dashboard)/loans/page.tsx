"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

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
import { Skeleton } from "@/components/ui/skeleton"
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
import { apiFetch } from "@/lib/api-client"
import {
  fetchEmployeeOption,
  fetchEmployeeOptions,
} from "@/lib/lazy-options"
import { usePermission } from "@/hooks/use-permission"
import { cn } from "@/lib/utils"

type LoanRow = {
  id: string
  employeeId: string
  totalAmount: number | string
  status: "PENDING" | "APPROVED" | "PAID_OFF"
  createdAt: string
  employee?: { id: string; name: string }
  installments?: {
    id: string
    dueDate: string
    amount: number | string
    status: string
  }[]
}

const STATUS_AR: Record<string, string> = {
  PENDING: "قيد الانتظار",
  APPROVED: "معتمدة",
  PAID_OFF: "مسددة",
}

const createSchema = z.object({
  employeeId: z.string().optional(),
  totalAmount: z.string().min(1, "المبلغ مطلوب"),
})

const approveSchema = z.object({
  numberOfInstallments: z.string().min(1, "عدد الأقساط مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
})

type CreateValues = z.infer<typeof createSchema>
type ApproveValues = z.infer<typeof approveSchema>

function n(v: number | string) {
  return typeof v === "string" ? Number(v) : v
}

export default function LoansPage() {
  const { user } = usePermission()
  const isPortal = Boolean(user?.isPortalUser)

  const [rows, setRows] = React.useState<LoanRow[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [status, setStatus] = React.useState("ALL")
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [approveLoan, setApproveLoan] = React.useState<LoanRow | null>(null)
  const [detail, setDetail] = React.useState<LoanRow | null>(null)
  const [saving, setSaving] = React.useState(false)

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { employeeId: "", totalAmount: "" },
  })

  const approveForm = useForm<ApproveValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      numberOfInstallments: "6",
      startDate: new Date().toISOString().slice(0, 10),
    },
  })

  React.useEffect(() => {
    setPage(1)
  }, [status, limit])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      if (isPortal) {
        const list = await apiFetch<LoanRow[]>("/ess/loans")
        const filtered =
          status === "ALL" ? list : list.filter((r) => r.status === status)
        setRows(filtered)
        setMeta({
          page: 1,
          limit: filtered.length || 10,
          itemCount: filtered.length,
          pageCount: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        })
        return
      }
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        order: "desc",
      })
      if (status !== "ALL") params.set("status", status)
      const res = await apiFetch<{ data: LoanRow[]; meta?: PageMeta }>(
        `/loans?${params}`,
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
      toast.error(err instanceof Error ? err.message : "تعذر تحميل السلف")
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [isPortal, status, page, limit])

  React.useEffect(() => {
    void load()
  }, [load])

  async function onCreate(values: CreateValues) {
    setSaving(true)
    try {
      if (isPortal) {
        await apiFetch("/ess/loans", {
          method: "POST",
          body: { totalAmount: Number(values.totalAmount) },
        })
        toast.success("تم إرسال طلب السلفة")
      } else {
        if (!values.employeeId) {
          toast.error("الموظف مطلوب")
          return
        }
        await apiFetch(`/employees/${values.employeeId}/loans`, {
          method: "POST",
          body: { totalAmount: Number(values.totalAmount) },
        })
        toast.success("تم إنشاء السلفة")
      }
      setCreateOpen(false)
      createForm.reset()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الإنشاء")
    } finally {
      setSaving(false)
    }
  }

  async function onApprove(values: ApproveValues) {
    if (!approveLoan) return
    setSaving(true)
    try {
      await apiFetch(`/loans/${approveLoan.id}/approve`, {
        method: "PATCH",
        body: {
          numberOfInstallments: Number(values.numberOfInstallments),
          startDate: values.startDate,
        },
      })
      toast.success("تم اعتماد السلفة")
      setApproveLoan(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الاعتماد")
    } finally {
      setSaving(false)
    }
  }

  async function openDetail(row: LoanRow) {
    if (isPortal) {
      setDetail(row)
      return
    }
    try {
      const loan = await apiFetch<LoanRow>(`/loans/${row.id}`)
      setDetail(loan)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر فتح السلفة")
    }
  }

  return (
    <>
      <SiteHeader
        title={isPortal ? "سلفتي" : "السلف"}
        breadcrumbs={[isPortal ? "سلفتي" : "السلف"]}
      />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-almarai text-2xl font-bold">
              {isPortal ? "سلفتي" : "السلف والقروض"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPortal
                ? "قدّم طلب سلفة وتابع حالة الأقساط بعد الاعتماد."
                : "إنشاء سلفة للموظف واعتماد جدول الأقساط."}
            </p>
          </div>
          <Button
            type="button"
            className="gap-2 rounded-lg"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-4" />
            {isPortal ? "طلب سلفة" : "سلفة جديدة"}
          </Button>
        </div>

        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="h-9! w-44 rounded-lg">
            <SelectValue>
              {(v: string | null) =>
                !v || v === "ALL" ? "كل الحالات" : STATUS_AR[v] ?? v
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            <SelectItem value="PENDING">قيد الانتظار</SelectItem>
            <SelectItem value="APPROVED">معتمدة</SelectItem>
            <SelectItem value="PAID_OFF">مسددة</SelectItem>
          </SelectContent>
        </Select>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>{isPortal ? "المبلغ" : "الموظف"}</TableHead>
                {isPortal ? null : <TableHead>المبلغ</TableHead>}
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                    <TableCell
                      colSpan={isPortal ? 4 : 5}
                      className="h-28 text-center text-muted-foreground"
                    >
                    لا توجد سلف
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium tabular-nums">
                      {isPortal
                        ? n(r.totalAmount).toLocaleString("en-US")
                        : (r.employee?.name ?? "—")}
                    </TableCell>
                    {isPortal ? null : (
                    <TableCell className="tabular-nums">
                      {n(r.totalAmount).toLocaleString("en-US")}
                    </TableCell>
                    )}
                    <TableCell>{formatDateAr(r.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full",
                          r.status === "APPROVED" &&
                            "border-transparent bg-primary/10 text-primary",
                          r.status === "PENDING" &&
                            "border-transparent bg-orange-100 text-orange-700",
                        )}
                      >
                        {STATUS_AR[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => void openDetail(r)}
                        >
                          تفاصيل
                        </Button>
                        {!isPortal && r.status === "PENDING" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setApproveLoan(r)}
                          >
                            اعتماد
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {meta && !isPortal && meta.pageCount > 0 ? (
            <TablePagination
              meta={meta}
              page={page}
              limit={limit}
              shownCount={rows.length}
              disabled={loading}
              onPageChange={setPage}
              onLimitChange={(n) => {
                setLimit(n)
                setPage(1)
              }}
            />
          ) : null}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isPortal ? "طلب سلفة" : "سلفة جديدة"}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreate)}
              className="space-y-4"
              noValidate
            >
              {isPortal ? null : (
              <FormInput
                name="employeeId"
                label="الموظف"
                formType="combobox"
                required
                lazyQueryKey="loan-employees"
                lazyFetchFn={fetchEmployeeOptions}
                lazyFetchItemFn={fetchEmployeeOption}
                placeholder="اختر الموظف"
              />
              )}
              <FormInput
                name="totalAmount"
                label="المبلغ الإجمالي"
                formType="input"
                inputType="number"
                required
                min={1}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2Icon className="size-4 animate-spin" /> : isPortal ? "إرسال الطلب" : "إنشاء"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!approveLoan}
        onOpenChange={(o) => {
          if (!o) setApproveLoan(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>اعتماد السلفة وتقسيطها</DialogTitle>
          </DialogHeader>
          <Form {...approveForm}>
            <form
              onSubmit={approveForm.handleSubmit(onApprove)}
              className="space-y-4"
              noValidate
            >
              <FormInput
                name="numberOfInstallments"
                label="عدد الأقساط"
                formType="input"
                inputType="number"
                required
                min={1}
                max={240}
              />
              <FormInput
                name="startDate"
                label="تاريخ أول قسط"
                formType="datepicker"
                required
                placeholder="اختر التاريخ"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApproveLoan(null)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2Icon className="size-4 animate-spin" /> : "اعتماد"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetail(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              تفاصيل سلفة {detail?.employee?.name ?? ""}
            </DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3">
              <p className="text-sm">
                المبلغ:{" "}
                <span className="font-medium tabular-nums">
                  {n(detail.totalAmount).toLocaleString("en-US")}
                </span>
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاستحقاق</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detail.installments ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        لا أقساط بعد (بانتظار الاعتماد)
                      </TableCell>
                    </TableRow>
                  ) : (
                    (detail.installments ?? []).map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{formatDateAr(i.dueDate)}</TableCell>
                        <TableCell className="tabular-nums">
                          {n(i.amount).toLocaleString("en-US")}
                        </TableCell>
                        <TableCell>{i.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
