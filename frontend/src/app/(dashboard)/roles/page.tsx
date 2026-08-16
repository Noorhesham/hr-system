"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  EllipsisIcon,
  EyeIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  DeleteRoleDialog,
  ProtectedRoleDialog,
  RoleFormDialog,
} from "@/components/roles/role-dialogs"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "@/components/table-pagination"
import { apiFetch } from "@/lib/api-client"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import {
  employeeCountLabel,
  formatYmd,
  paginateRows,
  permissionCountLabel,
  roleLabelAr,
  type RoleRow,
  type RoleUserRow,
} from "@/lib/roles"
import { cn } from "@/lib/utils"

const STATUS_UI = {
  active: {
    label: "نشط",
    className: "bg-primary/10 text-primary border-transparent",
    dot: "bg-primary",
  },
  inactive: {
    label: "غير نشط",
    className: "bg-muted text-muted-foreground border-transparent",
    dot: "bg-muted-foreground",
  },
} as const

export default function RolesPage() {
  const router = useRouter()
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.MANAGE_ROLES)

  const [roles, setRoles] = React.useState<RoleRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(8)
  const { search, setSearch, debouncedSearch } = useDebouncedSearch(300)
  const [status, setStatus] = React.useState<string>("ALL")

  const [formOpen, setFormOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<RoleRow | null>(null)
  const [deleteUsers, setDeleteUsers] = React.useState<RoleUserRow[]>([])
  const [deleting, setDeleting] = React.useState(false)
  const [protectedRole, setProtectedRole] = React.useState<RoleRow | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const list = await apiFetch<RoleRow[]>("/roles")
      setRoles(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الأدوار")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, limit])

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return roles.filter((role) => {
      if (status === "ACTIVE" && !role.isActive) return false
      if (status === "INACTIVE" && role.isActive) return false
      if (!q) return true
      const label = roleLabelAr(role.name)
      return (
        label.toLowerCase().includes(q) ||
        role.name.toLowerCase().includes(q)
      )
    })
  }, [roles, debouncedSearch, status])

  const { data: rows, meta } = React.useMemo(
    () => paginateRows(filtered, page, limit),
    [filtered, page, limit],
  )

  async function createRole(values: {
    name: string
    description: string
    isActive: boolean
  }) {
    setSaving(true)
    try {
      const created = await apiFetch<RoleRow>("/roles", {
        method: "POST",
        body: {
          name: values.name,
          description: values.description || undefined,
          permissionActions: [],
        },
      })
      toast.success("تم إنشاء الدور")
      setFormOpen(false)
      router.push(`/roles/${created.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إنشاء الدور")
    } finally {
      setSaving(false)
    }
  }

  function requestDelete(role: RoleRow) {
    if (role.isSystem) {
      setProtectedRole(role)
      return
    }
    setDeleteTarget(role)
    setDeleteUsers([])
    void apiFetch<RoleUserRow[]>(`/roles/${role.id}/users`)
      .then(setDeleteUsers)
      .catch(() => setDeleteUsers([]))
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/roles/${deleteTarget.id}`, { method: "DELETE" })
      toast.success("تم حذف الدور")
      setDeleteTarget(null)
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف الدور")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <SiteHeader
        title="إدارة الأدوار و الصلاحيات"
        breadcrumbs={["إدارة الأدوار و الصلاحيات"]}
      />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-almarai text-2xl font-bold tracking-tight">
                إدارة الأدوار و الصلاحيات
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                إدارة أدوار المستخدمين وصلاحياتهم وتعيين مهامهم في النظام
              </p>
            </div>
            {canManage ? (
              <Button
                type="button"
                className="h-10 shrink-0 gap-2 rounded-lg"
                onClick={() => setFormOpen(true)}
              >
                <PlusIcon className="size-4" />
                إضافة دور جديد
              </Button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 border-b border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن طريق الاسم..."
                  className="h-9 rounded-lg pe-9"
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v !== null) setStatus(v)
                }}
              >
                <SelectTrigger className="h-9! w-full rounded-lg sm:w-44">
                  <SelectValue>
                    {(value: string | null) => {
                      if (!value || value === "ALL") return "جميع الحالات"
                      if (value === "ACTIVE") return "نشط"
                      if (value === "INACTIVE") return "غير نشط"
                      return value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="INACTIVE">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">اسم الدور</TableHead>
                  <TableHead>المستخدمين</TableHead>
                  <TableHead>عدد الصلاحيات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
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
                      لا توجد أدوار مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((role) => {
                    const statusUi = role.isActive
                      ? STATUS_UI.active
                      : STATUS_UI.inactive
                    return (
                      <TableRow key={role.id} className="hover:bg-muted/40">
                        <TableCell className="px-4 py-3.5 font-semibold">
                          {roleLabelAr(role.name)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          {employeeCountLabel(role.userCount)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          {permissionCountLabel(role.permissions.length)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
                              statusUi.className,
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                statusUi.dot,
                              )}
                            />
                            {statusUi.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 tabular-nums">
                          {formatYmd(role.createdAt)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label="عرض"
                              render={<Link href={`/roles/${role.id}`} />}
                            >
                              <EyeIcon className="size-4" />
                            </Button>
                            {canManage ? (
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
                                <DropdownMenuContent
                                  align="end"
                                  className="min-w-44"
                                >
                                  <DropdownMenuItem
                                    render={
                                      <Link href={`/roles/${role.id}`} />
                                    }
                                  >
                                    عرض الدور
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    render={
                                      <Link href={`/roles/${role.id}`} />
                                    }
                                  >
                                    تعديل الصلاحيات
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => requestDelete(role)}
                                  >
                                    حذف الدور
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {!loading ? (
              <TablePagination
                meta={meta}
                page={page}
                limit={limit}
                shownCount={rows.length}
                disabled={loading}
                limitOptions={[8, 10, 20, 50]}
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

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={null}
        loading={saving}
        onSubmit={createRole}
      />
      <DeleteRoleDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        role={deleteTarget}
        users={deleteUsers}
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <ProtectedRoleDialog
        open={!!protectedRole}
        onOpenChange={(open) => {
          if (!open) setProtectedRole(null)
        }}
        roleName={protectedRole?.name ?? ""}
      />
    </>
  )
}
