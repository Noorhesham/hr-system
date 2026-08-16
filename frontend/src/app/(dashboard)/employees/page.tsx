"use client"

import * as React from "react"
import Link from "next/link"
import {
  DownloadIcon,
  EllipsisIcon,
  EyeIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { DeleteEmployeesDialog } from "@/components/employees/delete-dialogs"
import { Combobox } from "@/components/form"
import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import {
  TablePagination,
  type PageMeta,
} from "@/components/table-pagination"
import { apiFetch } from "@/lib/api-client"
import { fetchDepartmentOption, fetchDepartmentOptions } from "@/lib/lazy-options"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { cn } from "@/lib/utils"

type AccountStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"

type EmployeeRow = {
  id: string
  name: string
  employeeCode: string
  email: string | null
  photoUrl?: string | null
  department: string | null
  position: string | null
  salaryBasis: "MONTHLY" | "DAILY" | "HOURLY"
  isActive: boolean
  accountStatus: AccountStatus
  onLeave: boolean
}

type EmployeesPage = {
  data: EmployeeRow[]
  meta: PageMeta
}

const STATUS_UI: Record<
  AccountStatus,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: {
    label: "نشط",
    className: "bg-primary/10 text-primary border-transparent",
    dot: "bg-primary",
  },
  ON_LEAVE: {
    label: "في إجازة",
    className: "bg-orange-100 text-orange-700 border-transparent",
    dot: "bg-orange-500",
  },
  INACTIVE: {
    label: "غير نشط",
    className: "bg-muted text-muted-foreground border-transparent",
    dot: "bg-muted-foreground",
  },
}

const SALARY_BASIS_AR: Record<string, string> = {
  MONTHLY: "شهري",
  DAILY: "يومي",
  HOURLY: "ساعي",
}

function arabicInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
  }
  return name.slice(0, 2) || "؟"
}

export default function EmployeesPage() {
  const [rows, setRows] = React.useState<EmployeeRow[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(8)
  const { search, setSearch, debouncedSearch } = useDebouncedSearch(300)
  const [department, setDepartment] = React.useState<string>("ALL")
  const [accountStatus, setAccountStatus] = React.useState<string>("ALL")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [reloadToken, setReloadToken] = React.useState(0)
  const [deleting, setDeleting] = React.useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)
  const [singleDelete, setSingleDelete] = React.useState<{
    id: string
    name: string
  } | null>(null)

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, department, accountStatus, limit])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          orderBy: "name",
          order: "asc",
        })
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (department !== "ALL") params.set("departmentId", department)
        if (accountStatus !== "ALL") params.set("accountStatus", accountStatus)

        const res = await apiFetch<EmployeesPage>(
          `/employees?${params.toString()}`,
        )
        if (!cancelled) {
          setRows(res.data)
          setMeta(res.meta)
          setSelected(new Set())
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "تعذر تحميل الموظفين",
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, limit, debouncedSearch, department, accountStatus, reloadToken])

  const allSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id))

  function toggleAll(checked: boolean) {
    if (checked) setSelected(new Set(rows.map((r) => r.id)))
    else setSelected(new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function confirmBulkDelete() {
    const ids = [...selected]
    if (!ids.length) return
    setDeleting(true)
    try {
      const res = await apiFetch<{ deleted: number }>("/employees/bulk-delete", {
        method: "POST",
        body: { ids },
      })
      toast.success(`تم حذف ${res.deleted} موظف`)
      setBulkDeleteOpen(false)
      setSelected(new Set())
      setReloadToken((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف الموظفين")
    } finally {
      setDeleting(false)
    }
  }

  async function confirmSingleDelete() {
    if (!singleDelete) return
    setDeleting(true)
    try {
      await apiFetch<{ success: true }>(`/employees/${singleDelete.id}`, {
        method: "DELETE",
      })
      toast.success(`تم حذف حساب ${singleDelete.name}`)
      setSingleDelete(null)
      setReloadToken((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف الموظف")
    } finally {
      setDeleting(false)
    }
  }

  function downloadCsv() {
    if (!rows.length) {
      toast.message("لا توجد صفوف للتصدير")
      return
    }
    const header = [
      "الاسم",
      "الرقم الوظيفي",
      "البريد",
      "القسم",
      "المهنة",
      "الحالة",
      "دورة الرواتب",
    ]
    const lines = rows.map((r) =>
      [
        r.name,
        r.employeeCode,
        r.email ?? "",
        r.department ?? "",
        r.position ?? "",
        STATUS_UI[r.accountStatus].label,
        SALARY_BASIS_AR[r.salaryBasis] ?? r.salaryBasis,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    )
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `employees-page-${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedCount = selected.size

  return (
    <>
      <SiteHeader
        title="إدارة الموظفين"
        breadcrumbs={[
          { label: "الموظفون", href: "/employees" },
          { label: "إدارة الموظفين" },
        ]}
      />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-almarai text-2xl font-bold tracking-tight">
                إدارة الموظفين
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                إدارة جميع الموظفين وتحديث بياناتهم وتنظيم صلاحياتهم بكفاءة.
              </p>
            </div>
            <Button
              type="button"
              className="h-10 shrink-0 gap-2 rounded-lg"
              render={<Link href="/employees/new" />}
            >
              <PlusIcon className="size-4" />
              إضافة موظف جديد
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-white p-3 shadow-[0_1px_3px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن طريق الاسم، الرقم الوظيفي..."
                  className="h-9 rounded-lg pe-9"
                />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs">
                <Combobox
                  value={department === "ALL" ? "ALL" : department}
                  onValueChange={(v) => setDepartment(v || "ALL")}
                  queryKey="employees-dept-filter"
                  fetchFn={fetchDepartmentOptions}
                  fetchItemFn={fetchDepartmentOption}
                  leadingOptions={[{ value: "ALL", label: "جميع الأقسام" }]}
                  placeholder="جميع الأقسام"
                  searchPlaceholder="بحث عن قسم..."
                  className="h-9!"
                />
              </div>
              <Select
                value={accountStatus}
                onValueChange={(v) => {
                  if (v !== null) setAccountStatus(v)
                }}
              >
                <SelectTrigger className="h-9! w-full rounded-lg sm:w-40">
                  <SelectValue>
                    {(value: string | null) => {
                      if (!value || value === "ALL") return "جميع الحالات"
                      if (value === "ACTIVE") return "نشط"
                      if (value === "ON_LEAVE") return "في إجازة"
                      if (value === "INACTIVE") return "غير نشط"
                      return value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="ON_LEAVE">في إجازة</SelectItem>
                  <SelectItem value="INACTIVE">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 rounded-lg"
              onClick={downloadCsv}
            >
              <DownloadIcon className="size-4" />
              تحميل
            </Button>
          </div>

          {selectedCount > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-primary">
                تم تحديد {selectedCount}{" "}
                {selectedCount === 1 ? "موظف" : "موظفين"}
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-9 gap-2 rounded-lg"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2Icon className="size-4" />
                حذف
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-10 pe-0">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(c) => toggleAll(c === true)}
                      aria-label="تحديد الكل"
                    />
                  </TableHead>
                  <TableHead>اسم الموظف</TableHead>
                  <TableHead>الرقم الوظيفي</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>المهنة</TableHead>
                  <TableHead>حالة الحساب</TableHead>
                  <TableHead>دورة الرواتب</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-28" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 text-center text-muted-foreground"
                    >
                      لا يوجد موظفون مطابقون للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const status = STATUS_UI[row.accountStatus]
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="pe-0">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(c) =>
                              toggleOne(row.id, c === true)
                            }
                            aria-label={`تحديد ${row.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 bg-primary/10">
                              {row.photoUrl ? (
                                <AvatarImage src={row.photoUrl} alt={row.name} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {arabicInitials(row.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {row.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {row.email ?? "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">
                          {row.employeeCode}
                        </TableCell>
                        <TableCell>{row.department ?? "—"}</TableCell>
                        <TableCell>{row.position ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
                              status.className,
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                status.dot,
                              )}
                            />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {SALARY_BASIS_AR[row.salaryBasis] ?? row.salaryBasis}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label="عرض"
                              render={
                                <Link href={`/employees/${row.id}`} />
                              }
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
                              <DropdownMenuContent align="end" className="min-w-44">
                                <DropdownMenuItem
                                  render={
                                    <Link
                                      href={`/employees/${row.id}/edit`}
                                    />
                                  }
                                >
                                  تعديل الحساب
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    setSingleDelete({
                                      id: row.id,
                                      name: row.name,
                                    })
                                  }
                                >
                                  حذف الحساب
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

            {meta ? (
              <TablePagination
                meta={meta}
                page={page}
                limit={limit}
                shownCount={rows.length}
                disabled={loading}
                limitOptions={[8, 10, 20, 50]}
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

      <DeleteEmployeesDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedCount}
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />
      <DeleteEmployeesDialog
        open={!!singleDelete}
        onOpenChange={(open) => {
          if (!open) setSingleDelete(null)
        }}
        count={1}
        employeeName={singleDelete?.name}
        loading={deleting}
        onConfirm={confirmSingleDelete}
      />
    </>
  )
}
