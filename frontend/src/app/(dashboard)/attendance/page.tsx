"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { FormInput, Combobox, DateRangePicker } from "@/components/form"
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
import { PERMISSIONS } from "@/lib/permissions"
import { formatHoursDuration, formatMinutesDuration } from "@/lib/format-duration"
import { formatTime12h } from "@/lib/format-time"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { usePermission } from "@/hooks/use-permission"

type AttRow = {
  id: string
  employeeId: string
  date: string
  status: "PRESENT" | "ABSENT" | "LEAVE"
  checkIn: string | null
  checkOut: string | null
  delayMinutes: number
  overtimeHours: number | string
  employee?: { id: string; name: string }
}

const STATUS_AR: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  LEAVE: "إجازة",
}

const upsertSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
})

type UpsertValues = z.infer<typeof upsertSchema>

function currentMonthRange() {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return {
    from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    to: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
  }
}

function timeHm(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function dateOnly(iso: string) {
  return iso.slice(0, 10)
}

function toLocalIso(date: string, hm?: string) {
  if (!date || !hm) return null
  return `${date}T${hm}:00+03:00`
}

const EMPTY_FORM: UpsertValues = {
  employeeId: "",
  date: new Date().toISOString().slice(0, 10),
  status: "PRESENT",
  checkIn: "08:00",
  checkOut: "17:00",
}

export default function AttendancePage() {
  const { user } = useAuth()
  const { can } = usePermission()
  const isPortal = Boolean(user?.isPortalUser)
  const canManage = !isPortal && can(PERMISSIONS.MANAGE_ATTENDANCE)
  const initialRange = currentMonthRange()
  const [dateFrom, setDateFrom] = React.useState(initialRange.from)
  const [dateTo, setDateTo] = React.useState(initialRange.to)
  const [status, setStatus] = React.useState("ALL")
  const [employeeId, setEmployeeId] = React.useState("ALL")
  const [rows, setRows] = React.useState<AttRow[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AttRow | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [punching, setPunching] = React.useState<string | null>(null)

  const form = useForm<UpsertValues>({
    resolver: zodResolver(upsertSchema),
    defaultValues: EMPTY_FORM,
  })
  const statusValue = form.watch("status")
  const showTimes = statusValue === "PRESENT"

  React.useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, status, employeeId, limit])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        order: "desc",
        orderBy: "date",
        dateFrom,
        dateTo,
      })
      if (status !== "ALL") params.set("status", status)
      if (employeeId !== "ALL") params.set("employeeId", employeeId)
      const res = await apiFetch<{ data: AttRow[]; meta: PageMeta }>(
        `/attendance?${params}`,
      )
      setRows(res.data ?? [])
      setMeta(res.meta ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الحضور")
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, status, employeeId, page, limit])

  React.useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    form.reset(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(row: AttRow) {
    setEditing(row)
    form.reset({
      employeeId: row.employeeId,
      date: dateOnly(row.date),
      status: row.status,
      checkIn: timeHm(row.checkIn),
      checkOut: timeHm(row.checkOut),
    })
    setOpen(true)
  }

  async function onUpsert(values: UpsertValues) {
    setSaving(true)
    try {
      const withTimes = values.status === "PRESENT"
      const checkIn = withTimes ? toLocalIso(values.date, values.checkIn) : null
      const checkOut = withTimes ? toLocalIso(values.date, values.checkOut) : null
      if (editing) {
        await apiFetch(`/attendance/${editing.id}`, {
          method: "PATCH",
          body: { status: values.status, checkIn, checkOut },
        })
        toast.success("تم تحديث سجل الحضور")
      } else {
        await apiFetch("/attendance", {
          method: "POST",
          body: {
            employeeId: values.employeeId,
            date: values.date,
            status: values.status,
            ...(withTimes ? { checkIn, checkOut } : {}),
          },
        })
        toast.success("تم حفظ سجل الحضور")
      }
      setOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  async function punch(kind: "in" | "out", empId?: string) {
    setPunching(`${kind}-${empId || "self"}`)
    try {
      await apiFetch(`/attendance/check-${kind === "in" ? "in" : "out"}`, {
        method: "POST",
        body: isPortal || !empId ? {} : { employeeId: empId },
      })
      toast.success(kind === "in" ? "تم تسجيل الحضور" : "تم تسجيل الانصراف")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر التسجيل")
    } finally {
      setPunching(null)
    }
  }

  return (
    <>
      <SiteHeader
        title={isPortal ? "حضوري" : "الحضور والانصراف"}
        breadcrumbs={[isPortal ? "حضوري" : "الحضور"]}
      />
      <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-almarai text-2xl font-bold">
              {isPortal ? "حضوري" : "الحضور والانصراف"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPortal
                ? "سجّل حضورك وانصرافك وتابع سجل أيامك."
                : canManage
                  ? "عرض السجلات، الإدخال اليدوي، وتعديل الحضور والانصراف."
                  : "عرض سجلات الحضور والانصراف."}
            </p>
          </div>
          {isPortal ? (
            <div className="flex gap-2">
              <Button
                type="button"
                className="gap-2 rounded-lg"
                disabled={!!punching}
                onClick={() => void punch("in")}
              >
                {punching === "in-self" ? "…" : "تسجيل حضور"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-lg"
                disabled={!!punching}
                onClick={() => void punch("out")}
              >
                {punching === "out-self" ? "…" : "تسجيل انصراف"}
              </Button>
            </div>
          ) : canManage ? (
          <Button
            type="button"
            className="gap-2 rounded-lg"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" />
            إدخال يدوي
          </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            placeholder="اختر يوماً أو فترة"
            className="h-9 w-auto min-w-56 rounded-lg"
            hint="اضغط يوماً واحداً أو بداية ثم نهاية."
            showThisMonth
            onChange={({ from, to }) => {
              if (!from) return
              setDateFrom(from)
              setDateTo(to || from)
            }}
          />
          {isPortal ? null : (
          <Combobox
            value={employeeId}
            onValueChange={(v) => setEmployeeId(v || "ALL")}
            queryKey="attendance-employee-filter"
            fetchFn={fetchEmployeeOptions}
            fetchItemFn={fetchEmployeeOption}
            leadingOptions={[{ value: "ALL", label: "كل الموظفين" }]}
            placeholder="كل الموظفين"
            searchPlaceholder="بحث عن موظف..."
            className="h-9! w-56"
          />
          )}
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-9! w-40 rounded-lg">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === "ALL" ? "كل الحالات" : STATUS_AR[v] ?? v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              <SelectItem value="PRESENT">حاضر</SelectItem>
              <SelectItem value="ABSENT">غائب</SelectItem>
              <SelectItem value="LEAVE">إجازة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canManage && employeeId !== "ALL" ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={!!punching}
              onClick={() => void punch("in", employeeId)}
            >
              {punching === `in-${employeeId}` ? "…" : "تسجيل حضور"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={!!punching}
              onClick={() => void punch("out", employeeId)}
            >
              {punching === `out-${employeeId}` ? "…" : "تسجيل انصراف"}
            </Button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                {isPortal ? null : <TableHead>الموظف</TableHead>}
                <TableHead>التاريخ</TableHead>
                <TableHead>حضور</TableHead>
                <TableHead>انصراف</TableHead>
                <TableHead>تأخير</TableHead>
                <TableHead>إضافي</TableHead>
                <TableHead>الحالة</TableHead>
                {canManage ? <TableHead className="w-16"> </TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {isPortal ? null : (
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    )}
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isPortal ? 6 : canManage ? 8 : 7}
                    className="h-28 text-center text-muted-foreground"
                  >
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    {isPortal ? null : (
                    <TableCell className="font-medium">
                      {r.employee?.name ?? "—"}
                    </TableCell>
                    )}
                    <TableCell>{formatDateAr(r.date)}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatTime12h(r.checkIn)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTime12h(r.checkOut)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatMinutesDuration(r.delayMinutes)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatHoursDuration(r.overtimeHours)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full",
                          r.status === "PRESENT" &&
                            "bg-primary/10 text-primary border-transparent",
                          r.status === "ABSENT" &&
                            "bg-destructive/10 text-destructive border-transparent",
                          r.status === "LEAVE" &&
                            "bg-orange-100 text-orange-700 border-transparent",
                        )}
                      >
                        {STATUS_AR[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 rounded-lg"
                          onClick={() => openEdit(r)}
                        >
                          <PencilIcon className="size-3.5" />
                          تعديل
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {meta && meta.pageCount > 0 ? (
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل سجل الحضور" : "إدخال حضور يدوي"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onUpsert)}
              className="space-y-4"
              noValidate
            >
              <FormInput
                name="employeeId"
                label="الموظف"
                formType="combobox"
                required
                disabled={!!editing}
                lazyQueryKey="attendance-employees"
                lazyFetchFn={fetchEmployeeOptions}
                lazyFetchItemFn={fetchEmployeeOption}
                placeholder="اختر الموظف"
              />
              <FormInput
                name="date"
                label="التاريخ"
                formType="datepicker"
                required
                disabled={!!editing}
                placeholder="اختر التاريخ"
              />
              <FormInput
                name="status"
                label="الحالة"
                formType="select"
                required
                options={[
                  { value: "PRESENT", label: "حاضر" },
                  { value: "ABSENT", label: "غائب" },
                  { value: "LEAVE", label: "إجازة" },
                ]}
              />
              {showTimes ? (
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    name="checkIn"
                    label="وقت الحضور"
                    formType="input"
                    inputType="time"
                  />
                  <FormInput
                    name="checkOut"
                    label="وقت الانصراف"
                    formType="input"
                    inputType="time"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  الغياب والإجازة بدون أوقات حضور أو انصراف. التأخير والإضافي
                  يُعاد حسابهما تلقائيًا.
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "…" : editing ? "تحديث" : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
