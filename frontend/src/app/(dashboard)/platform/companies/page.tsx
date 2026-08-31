"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
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
import { useDebouncedSearch } from "@/hooks/use-debounced-search"

type SubStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED"

type CompanyRow = {
  id: string
  name: string
  establishmentNumber: string | null
  subscriptionStatus: SubStatus
  trialEndsAt: string | null
  nextBillingDate: string | null
  billingCycle: string | null
  createdAt: string
  plan: { id: string; name: string; maxEmployees: number } | null
  _count: { employees: number; users: number }
  users: { email: string; isPlatformAdmin: boolean }[]
}

const STATUS_AR: Record<SubStatus, string> = {
  TRIAL: "تجربة",
  ACTIVE: "نشط",
  PAST_DUE: "متأخر",
  SUSPENDED: "موقوف",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ar-SA")
}

export default function PlatformCompaniesPage() {
  const [rows, setRows] = React.useState<CompanyRow[]>([])
  const [meta, setMeta] = React.useState<PageMeta | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [status, setStatus] = React.useState<string>("ALL")
  const { search, setSearch, debouncedSearch } = useDebouncedSearch(300)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        orderBy: "createdAt",
        order: "desc",
      })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (status !== "ALL") params.set("status", status)
      const res = await apiFetch<{ data: CompanyRow[]; meta?: PageMeta }>(
        `/platform/companies?${params}`,
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
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الشركات")
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, status])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, limit])

  React.useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <SiteHeader title="الشركات" breadcrumbs={["المنصة", "الشركات"]} />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div>
            <h2 className="font-almarai text-2xl font-bold tracking-tight">
              شركات المنصة
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              كل الشركات المسجّلة: الحالة، الباقة، وعدد الموظفين.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative min-w-0 sm:max-w-xs sm:flex-1">
              <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الإيميل..."
                className="h-9 rounded-lg pe-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v) setStatus(v)
              }}
            >
              <SelectTrigger className="h-9! w-full rounded-lg sm:w-40">
                <SelectValue>
                  {(v: string | null) =>
                    !v || v === "ALL"
                      ? "كل الحالات"
                      : (STATUS_AR[v as SubStatus] ?? v)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                <SelectItem value="TRIAL">تجربة</SelectItem>
                <SelectItem value="ACTIVE">نشط</SelectItem>
                <SelectItem value="PAST_DUE">متأخر</SelectItem>
                <SelectItem value="SUSPENDED">موقوف</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">الشركة</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>موظفون</TableHead>
                  <TableHead>الحسابات</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j} className="px-4 py-3.5">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-40 text-center text-muted-foreground"
                    >
                      لا توجد شركات مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell className="px-4">
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.users[0]?.email ?? "—"}
                        </p>
                      </TableCell>
                      <TableCell>{row.plan?.name ?? "بدون باقة"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {STATUS_AR[row.subscriptionStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row._count.employees}
                        {row.plan?.maxEmployees
                          ? ` / ${row.plan.maxEmployees}`
                          : ""}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row._count.users}
                      </TableCell>
                      <TableCell>{formatDate(row.createdAt)}</TableCell>
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
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
