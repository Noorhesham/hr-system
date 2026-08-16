"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { PermissionMatrix } from "@/components/roles/permission-matrix"
import {
  AssignUserDialog,
  DeleteRoleDialog,
  ProtectedRoleDialog,
  RoleFormDialog,
  UnassignUsersDialog,
} from "@/components/roles/role-dialogs"
import { SiteHeader } from "@/components/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablePagination } from "@/components/table-pagination"
import { apiFetch } from "@/lib/api-client"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePermission } from "@/hooks/use-permission"
import { COMPANY_OWNER_ROLE, PERMISSIONS } from "@/lib/permissions"
import {
  allMappedPermissionActions,
  arabicInitials,
  formatSlashDate,
  formatYmd,
  paginateRows,
  permissionCountLabel,
  permissionSetsEqual,
  roleDescriptionAr,
  roleLabelAr,
  type RoleRow,
  type RoleUserRow,
} from "@/lib/roles"
import { cn } from "@/lib/utils"

type TabValue = "permissions" | "users"

type AssignableUser = {
  id: string
  email: string
  fullName: string | null
  roleName: string
}

function parseTab(raw: string | null): TabValue {
  return raw === "users" ? "users" : "permissions"
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "border-transparent bg-primary/10 text-primary"
          : "border-transparent bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground",
        )}
      />
      {active ? "نشط" : "غير نشط"}
    </Badge>
  )
}

const tabTriggerClass =
  "h-auto flex-none rounded-none px-1 pb-3 text-sm text-muted-foreground after:bg-primary after:h-[3px] data-active:bg-transparent data-active:text-primary data-active:shadow-none"

export default function RoleDetailRoute() {
  return (
    <React.Suspense
      fallback={
        <>
          <SiteHeader
            title="إدارة الأدوار و الصلاحيات"
            breadcrumbs={[
              { label: "إدارة الأدوار و الصلاحيات", href: "/roles" },
              { label: "الدور" },
            ]}
          />
          <div className="flex flex-1 flex-col bg-[#F8F9FA]/50 px-4 py-5 lg:px-6 lg:py-6">
            <Skeleton className="h-[420px] w-full rounded-2xl" />
          </div>
        </>
      }
    >
      <RoleDetailPage />
    </React.Suspense>
  )
}

function RoleDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id
  const { can } = usePermission()
  const canManage = can(PERMISSIONS.MANAGE_ROLES)

  const [tab, setTab] = React.useState<TabValue>(() =>
    parseTab(searchParams.get("tab")),
  )
  const [role, setRole] = React.useState<RoleRow | null>(null)
  const [users, setUsers] = React.useState<RoleUserRow[]>([])
  const [allUsers, setAllUsers] = React.useState<AssignableUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedPerms, setSelectedPerms] = React.useState<Set<string>>(
    new Set(),
  )
  const [savedPerms, setSavedPerms] = React.useState<Set<string>>(new Set())
  const [savingPerms, setSavingPerms] = React.useState(false)
  const [saveAlert, setSaveAlert] = React.useState<
    null | "saving" | "success" | "error"
  >(null)
  const [saveError, setSaveError] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [savingForm, setSavingForm] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [protectedOpen, setProtectedOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [assigning, setAssigning] = React.useState(false)
  const [unassignIds, setUnassignIds] = React.useState<string[]>([])
  const [unassigning, setUnassigning] = React.useState(false)

  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(8)
  const { search, setSearch, debouncedSearch } = useDebouncedSearch(300)
  const [department, setDepartment] = React.useState("ALL")
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(
    new Set(),
  )

  React.useEffect(() => {
    setTab(parseTab(searchParams.get("tab")))
  }, [searchParams])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [r, u] = await Promise.all([
        apiFetch<RoleRow>(`/roles/${id}`),
        apiFetch<RoleUserRow[]>(`/roles/${id}/users`),
      ])
      setRole(r)
      setUsers(u)
      const next = new Set(r.permissions.map((p) => p.action))
      setSelectedPerms(next)
      setSavedPerms(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل الدور")
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void load()
  }, [load])

  React.useEffect(() => {
    if (!canManage) return
    let cancelled = false
    void apiFetch<
      { id: string; email: string; fullName: string | null; role: { name: string } }[]
    >("/roles/users")
      .then((list) => {
        if (cancelled) return
        setAllUsers(
          list.map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            roleName: u.role.name,
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setAllUsers([])
      })
    return () => {
      cancelled = true
    }
  }, [canManage])

  function setTabAndUrl(next: TabValue) {
    setTab(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next === "permissions") params.delete("tab")
    else params.set("tab", next)
    const qs = params.toString()
    router.replace(qs ? `/roles/${id}?${qs}` : `/roles/${id}`, { scroll: false })
  }

  React.useEffect(() => {
    if (saveAlert !== "success") return
    const t = window.setTimeout(() => setSaveAlert(null), 4000)
    return () => window.clearTimeout(t)
  }, [saveAlert])

  const ownerLocked = role?.name === COMPANY_OWNER_ROLE
  const canEditPerms = canManage && !ownerLocked
  const label = role ? roleLabelAr(role.name) : ""
  const permsDirty = !permissionSetsEqual(selectedPerms, savedPerms)

  function togglePerm(action: string) {
    if (!canEditPerms) return
    setSelectedPerms((prev) => {
      const next = new Set(prev)
      if (next.has(action)) next.delete(action)
      else next.add(action)
      return next
    })
    setSaveAlert(null)
  }

  function selectAllPerms() {
    if (!canEditPerms) return
    setSelectedPerms(new Set(allMappedPermissionActions()))
    setSaveAlert(null)
  }

  function deselectAllPerms() {
    if (!canEditPerms) return
    setSelectedPerms(new Set())
    setSaveAlert(null)
  }

  async function savePermissions() {
    if (!role || !canEditPerms) return
    setSavingPerms(true)
    setSaveAlert("saving")
    setSaveError("")
    try {
      const updated = await apiFetch<RoleRow>(`/roles/${role.id}`, {
        method: "PATCH",
        body: { permissionActions: Array.from(selectedPerms) },
      })
      setRole(updated)
      const next = new Set(updated.permissions.map((p) => p.action))
      setSelectedPerms(next)
      setSavedPerms(next)
      setSaveAlert("success")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذر حفظ الصلاحيات"
      setSaveError(message)
      setSaveAlert("error")
    } finally {
      setSavingPerms(false)
    }
  }

  async function saveRoleMeta(values: {
    name: string
    description: string
    isActive: boolean
  }) {
    if (!role) return
    setSavingForm(true)
    try {
      const body: Record<string, unknown> = {
        description: values.description,
        isActive: values.isActive,
      }
      if (!role.isSystem && !role.isLocked) body.name = values.name
      const updated = await apiFetch<RoleRow>(`/roles/${role.id}`, {
        method: "PATCH",
        body,
      })
      setRole(updated)
      setFormOpen(false)
      toast.success("تم تحديث الدور")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحديث الدور")
    } finally {
      setSavingForm(false)
    }
  }

  function requestDelete() {
    if (!role) return
    if (role.isSystem) setProtectedOpen(true)
    else setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!role) return
    setDeleting(true)
    try {
      await apiFetch(`/roles/${role.id}`, { method: "DELETE" })
      toast.success("تم حذف الدور")
      router.push("/roles")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف الدور")
    } finally {
      setDeleting(false)
    }
  }

  async function assignUser(userId: string) {
    if (!role) return
    setAssigning(true)
    try {
      await apiFetch(`/users/${userId}/role`, {
        method: "PATCH",
        body: { roleId: role.id },
      })
      toast.success("تم تعيين الدور")
      setAssignOpen(false)
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر التعيين")
    } finally {
      setAssigning(false)
    }
  }

  async function confirmUnassign() {
    if (!role || unassignIds.length === 0) return
    setUnassigning(true)
    try {
      await apiFetch(`/roles/${role.id}/users/unassign`, {
        method: "POST",
        body: { userIds: unassignIds },
      })
      toast.success("تم حذف الموظفين من الدور")
      setUnassignIds([])
      setSelectedUsers(new Set())
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إزالة الموظفين")
    } finally {
      setUnassigning(false)
    }
  }

  React.useEffect(() => {
    setPage(1)
    setSelectedUsers(new Set())
  }, [debouncedSearch, department, limit])

  const departments = React.useMemo(() => {
    const names = users
      .map((u) => u.department?.trim())
      .filter((d): d is string => Boolean(d))
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, "ar"))
  }, [users])

  const filteredUsers = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return users.filter((u) => {
      if (department !== "ALL" && (u.department ?? "") !== department) {
        return false
      }
      if (!q) return true
      const name = (u.fullName ?? "").toLowerCase()
      const email = u.email.toLowerCase()
      const code = (u.employeeCode ?? "").toLowerCase()
      return name.includes(q) || email.includes(q) || code.includes(q)
    })
  }, [users, debouncedSearch, department])

  const { data: userRows, meta } = React.useMemo(
    () => paginateRows(filteredUsers, page, limit),
    [filteredUsers, page, limit],
  )

  const allSelected =
    userRows.length > 0 && userRows.every((u) => selectedUsers.has(u.id))
  const selectedCount = selectedUsers.size

  const assignable = allUsers.filter((u) => u.id && !users.some((r) => r.id === u.id))

  if (loading) {
    return (
      <>
        <SiteHeader
          title="إدارة الأدوار و الصلاحيات"
          breadcrumbs={[
            { label: "إدارة الأدوار و الصلاحيات", href: "/roles" },
            { label: "الدور" },
          ]}
        />
        <div className="flex flex-1 flex-col bg-[#F8F9FA]/50 px-4 py-5 lg:px-6 lg:py-6">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      </>
    )
  }

  if (!role) {
    return (
      <>
        <SiteHeader
          title="إدارة الأدوار و الصلاحيات"
          breadcrumbs={[{ label: "إدارة الأدوار و الصلاحيات", href: "/roles" }]}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <p className="text-muted-foreground">الدور غير موجود</p>
          <Button type="button" variant="outline" onClick={() => router.push("/roles")}>
            العودة للأدوار
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader
        title={label}
        breadcrumbs={[
          { label: "إدارة الأدوار و الصلاحيات", href: "/roles" },
          { label },
        ]}
      />
      <div className="flex flex-1 flex-col bg-[#F8F9FA]/50">
        <div className="flex flex-1 flex-col px-4 py-5 lg:px-6 lg:py-6">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                if (typeof v === "string") setTabAndUrl(parseTab(v))
              }}
              className="gap-0"
            >
              <div className="flex flex-col gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-almarai text-2xl font-bold tracking-tight">
                        {label}
                      </h2>
                      <StatusBadge active={role.isActive} />
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {roleDescriptionAr(role)}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      تاريخ الإنشاء: {formatSlashDate(role.createdAt)}
                      <span className="mx-2">•</span>
                      آخر تحديث: {formatSlashDate(role.updatedAt)}
                      <span className="mx-2">•</span>
                      عدد المستخدمين: {role.userCount}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-10 gap-2 rounded-lg"
                        onClick={() => setFormOpen(true)}
                      >
                        <SquarePenIcon className="size-4" />
                        تعديل الدور
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 gap-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={requestDelete}
                      >
                        <Trash2Icon className="size-4" />
                        حذف الدور
                      </Button>
                    </div>
                  ) : null}
                </div>

                <TabsList
                  variant="line"
                  className="h-auto w-full justify-start gap-6 rounded-none border-b border-border/80 bg-transparent p-0"
                >
                  <TabsTrigger value="permissions" className={tabTriggerClass}>
                    الصلاحيات
                  </TabsTrigger>
                  <TabsTrigger value="users" className={tabTriggerClass}>
                    المستخدمون ({role.userCount})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="permissions" className="mt-0 px-5 py-5 sm:px-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {permsDirty ? (
                    <p className="text-sm font-medium text-orange-500">
                      • يوجد تغييرات غير محفوظة
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      • إجمالي الصلاحيات المفعلة لهذا الدور:{" "}
                      {permissionCountLabel(selectedPerms.size)}
                    </p>
                  )}
                  {canEditPerms ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg border-foreground/20"
                        disabled={savingPerms}
                        onClick={selectAllPerms}
                      >
                        تحديد الكل
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={savingPerms}
                        onClick={deselectAllPerms}
                      >
                        إلغاء تحديد الكل
                      </Button>
                    </div>
                  ) : null}
                </div>

                {saveAlert === "saving" ? (
                  <Alert className="mb-4">
                    <Loader2Icon className="animate-spin" />
                    <AlertTitle>جاري حفظ الصلاحيات</AlertTitle>
                    <AlertDescription>
                      يرجى الانتظار حتى يتم تطبيق التغييرات على الدور.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {saveAlert === "success" ? (
                  <Alert variant="success" className="mb-4">
                    <CheckCircle2Icon />
                    <AlertTitle>تم حفظ الصلاحيات</AlertTitle>
                    <AlertDescription>
                      تم تحديث صلاحيات هذا الدور وتطبيقها على المستخدمين المعينين.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {saveAlert === "error" ? (
                  <Alert variant="destructive" className="mb-4">
                    <CircleAlertIcon />
                    <AlertTitle>تعذر حفظ الصلاحيات</AlertTitle>
                    <AlertDescription>
                      {saveError || "حدث خطأ أثناء حفظ التغييرات. حاول مرة أخرى."}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {permsDirty && canEditPerms && saveAlert !== "saving" ? (
                  <Alert variant="warning" className="mb-4">
                    <CircleAlertIcon />
                    <AlertTitle>يوجد تغييرات غير محفوظة</AlertTitle>
                    <AlertDescription>
                      اضغط حفظ لتطبيق صلاحيات هذا الدور على المستخدمين المعينين.
                    </AlertDescription>
                    <div className="col-start-2 mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-8 rounded-lg"
                        disabled={savingPerms}
                        onClick={() => void savePermissions()}
                      >
                        حفظ التغييرات
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={savingPerms}
                        onClick={() => {
                          setSelectedPerms(new Set(savedPerms))
                          setSaveAlert(null)
                        }}
                      >
                        تراجع
                      </Button>
                    </div>
                  </Alert>
                ) : null}

                {ownerLocked ? (
                  <Alert className="mb-4">
                    <CircleAlertIcon />
                    <AlertTitle>صلاحيات مدير النظام ثابتة</AlertTitle>
                    <AlertDescription>
                      لا يمكن تعديل صلاحيات هذا الدور. أنشئ دوراً مخصصاً أو عدّل دوراً آخر.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {!canManage && !ownerLocked ? (
                  <Alert className="mb-4">
                    <CircleAlertIcon />
                    <AlertTitle>عرض فقط</AlertTitle>
                    <AlertDescription>
                      تحتاج صلاحية إدارة الأدوار لتعديل الصلاحيات.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <p className="mb-3 text-xs text-muted-foreground">
                  الخانات التي فيها شرطة غير متاحة لهذه القائمة. اضغط المربع ثم احفظ.
                </p>
                <PermissionMatrix
                  selected={selectedPerms}
                  disabled={!canEditPerms || savingPerms}
                  onToggle={togglePerm}
                />
              </TabsContent>

              <TabsContent value="users" className="mt-0 px-5 py-5 sm:px-6">
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1 sm:max-w-sm">
                      <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث عن طريق الاسم، الرقم الوظيفي..."
                        className="h-9 rounded-lg pe-9"
                      />
                    </div>
                    <Select
                      value={department}
                      onValueChange={(v) => {
                        if (v !== null) setDepartment(v)
                      }}
                    >
                      <SelectTrigger className="h-9! w-full rounded-lg sm:w-44">
                        <SelectValue>
                          {(value: string | null) =>
                            !value || value === "ALL" ? "جميع الأقسام" : value
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">جميع الأقسام</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {canManage ? (
                    <Button
                      type="button"
                      className="h-9 gap-2 rounded-lg"
                      onClick={() => setAssignOpen(true)}
                    >
                      <PlusIcon className="size-4" />
                      تعيين موظف
                    </Button>
                  ) : null}
                </div>

                {canManage && selectedCount > 0 ? (
                  <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-primary">
                      تم تحديد {selectedCount}{" "}
                      {selectedCount === 1 ? "موظف" : "موظفين"}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setUnassignIds([...selectedUsers])}
                    >
                      <Trash2Icon className="size-4" />
                      حذف الموظفين من الدور
                    </Button>
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-xl border border-border/80">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        {canManage ? (
                          <TableHead className="w-10 pe-0">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={(c) => {
                                if (c === true) {
                                  setSelectedUsers(
                                    new Set(userRows.map((u) => u.id)),
                                  )
                                } else {
                                  setSelectedUsers(new Set())
                                }
                              }}
                              aria-label="تحديد الكل"
                            />
                          </TableHead>
                        ) : null}
                        <TableHead>اسم الموظف</TableHead>
                        <TableHead>الرقم الوظيفي</TableHead>
                        <TableHead>القسم</TableHead>
                        <TableHead>تاريخ تعيين الدور</TableHead>
                        {canManage ? (
                          <TableHead className="text-center">إجراءات</TableHead>
                        ) : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={canManage ? 6 : 4}
                            className="h-40 text-center text-muted-foreground"
                          >
                            لا يوجد موظفون معينون لهذا الدور
                          </TableCell>
                        </TableRow>
                      ) : (
                        userRows.map((row) => {
                          const name = row.fullName || row.email
                          return (
                            <TableRow key={row.id}>
                              {canManage ? (
                                <TableCell className="pe-0">
                                  <Checkbox
                                    checked={selectedUsers.has(row.id)}
                                    onCheckedChange={(c) => {
                                      setSelectedUsers((prev) => {
                                        const next = new Set(prev)
                                        if (c === true) next.add(row.id)
                                        else next.delete(row.id)
                                        return next
                                      })
                                    }}
                                    aria-label={`تحديد ${name}`}
                                  />
                                </TableCell>
                              ) : null}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-9 bg-primary/10">
                                    {row.photoUrl ? (
                                      <AvatarImage src={row.photoUrl} alt={name} />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                      {arabicInitials(name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                      {name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {row.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm tabular-nums">
                                {row.employeeCode ?? "—"}
                              </TableCell>
                              <TableCell>{row.department ?? "—"}</TableCell>
                              <TableCell className="tabular-nums">
                                {formatYmd(row.assignedAt)}
                              </TableCell>
                              {canManage ? (
                                <TableCell>
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                                    onClick={() => setUnassignIds([row.id])}
                                  >
                                    <Trash2Icon className="size-4" />
                                    حذف الموظف
                                  </button>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                  {meta.itemCount > 0 ? (
                    <TablePagination
                      meta={meta}
                      page={page}
                      limit={limit}
                      shownCount={userRows.length}
                      limitOptions={[8, 10, 20, 50]}
                      showingLabel={(shown, total) =>
                        `نعرض ${shown} من أصل ${total}`
                      }
                      onPageChange={setPage}
                      onLimitChange={(n) => {
                        setLimit(n)
                        setPage(1)
                      }}
                    />
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={role}
        loading={savingForm}
        onSubmit={saveRoleMeta}
      />
      <DeleteRoleDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        role={role}
        users={users}
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <ProtectedRoleDialog
        open={protectedOpen}
        onOpenChange={setProtectedOpen}
        roleName={role.name}
      />
      <AssignUserDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        users={assignable}
        loading={assigning}
        onAssign={assignUser}
      />
      <UnassignUsersDialog
        open={unassignIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setUnassignIds([])
        }}
        count={unassignIds.length}
        loading={unassigning}
        onConfirm={confirmUnassign}
      />
    </>
  )
}
