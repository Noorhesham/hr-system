import type { PageMeta } from "@/components/table-pagination"
import { PERMISSIONS } from "@/lib/permissions"

export type PermissionRow = { id: string; action: string }

export type RoleRow = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  isSystem: boolean
  isLocked: boolean
  userCount: number
  permissions: PermissionRow[]
  createdAt: string
  updatedAt: string
}

export type RoleUserRow = {
  id: string
  email: string
  fullName: string | null
  isPortalUser: boolean
  assignedAt: string
  employeeId: string | null
  employeeCode: string | null
  department: string | null
  departmentId: string | null
  photoUrl: string | null
}

export const ROLE_LABEL_AR: Record<string, string> = {
  "Company Owner": "مدير النظام",
  HR: "مسؤول الموارد البشرية",
  Manager: "مدير قسم",
  Payroll: "مسؤول الرواتب و الحسابات",
  Employee: "موظف",
}

export const ROLE_DESCRIPTION_AR: Record<string, string> = {
  "Company Owner":
    "دور نظام محمي يمنح صلاحيات كاملة لإدارة المنشأة والمستخدمين والصلاحيات الأساسية.",
  HR: "إدارة شؤون الموظفين، التوظيف والتقييمات، وإعداد مسيرات الرواتب الأساسية",
  Manager: "اعتماد طلبات الفريق ومتابعة الحضور والإجازات داخل القسم.",
  Payroll: "إدارة الرواتب والسلف والتقارير المالية للمنشأة.",
  Employee: "صلاحيات الموظف الأساسية في البوابة الذاتية.",
}

export function roleLabelAr(name: string): string {
  return ROLE_LABEL_AR[name] ?? name
}

export function roleDescriptionAr(role: Pick<RoleRow, "name" | "description">): string {
  const custom = role.description?.trim()
  if (custom) return custom
  return ROLE_DESCRIPTION_AR[role.name] ?? "لا يوجد وصف لهذا الدور."
}

export function formatYmd(iso: string): string {
  return iso.slice(0, 10)
}

export function formatSlashDate(iso: string): string {
  return formatYmd(iso).replaceAll("-", "/")
}

export function employeeCountLabel(count: number): string {
  return `${count} موظف`
}

export function permissionCountLabel(count: number): string {
  return `${count} صلاحية`
}

export function arabicInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
  }
  return name.slice(0, 2) || "؟"
}

export function paginateRows<T>(
  items: T[],
  page: number,
  limit: number,
): { data: T[]; meta: PageMeta } {
  const itemCount = items.length
  const pageCount = Math.max(1, Math.ceil(itemCount / Math.max(1, limit)))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const start = (safePage - 1) * limit
  return {
    data: items.slice(start, start + limit),
    meta: {
      page: safePage,
      limit,
      itemCount,
      pageCount,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < pageCount,
    },
  }
}

export const PERMISSION_COLUMNS = [
  { key: "view", label: "عرض" },
  { key: "create", label: "إنشاء" },
  { key: "edit", label: "تعديل" },
  { key: "delete", label: "حذف" },
  { key: "export", label: "تصدير" },
  { key: "approve", label: "اعتماد" },
  { key: "manage", label: "إدارة" },
] as const

export type PermissionColumnKey = (typeof PERMISSION_COLUMNS)[number]["key"]

export type PermissionModule = {
  id: string
  label: string
  cells: Partial<Record<PermissionColumnKey, string>>
}

export function allMappedPermissionActions(): string[] {
  const actions = new Set<string>()
  for (const mod of PERMISSION_MODULES) {
    for (const action of Object.values(mod.cells)) {
      if (action) actions.add(action)
    }
  }
  return [...actions]
}

export function permissionSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { id: "dashboard", label: "لوحة التحكم", cells: {} },
  {
    id: "payroll",
    label: "الرواتب",
    cells: { manage: PERMISSIONS.MANAGE_PAYROLL },
  },
  {
    id: "roles",
    label: "الأدوار والصلاحيات",
    cells: {
      view: PERMISSIONS.VIEW_ROLES,
      manage: PERMISSIONS.MANAGE_ROLES,
    },
  },
  {
    id: "departments",
    label: "الأقسام",
    cells: { manage: PERMISSIONS.MANAGE_DEPARTMENTS },
  },
  {
    id: "employees",
    label: "الموظفون",
    cells: {
      view: PERMISSIONS.VIEW_EMPLOYEE,
      create: PERMISSIONS.CREATE_EMPLOYEE,
      edit: PERMISSIONS.UPDATE_EMPLOYEE,
    },
  },
  {
    id: "leaves",
    label: "الإجازات",
    cells: {
      approve: PERMISSIONS.APPROVE_LEAVES,
      manage: PERMISSIONS.MANAGE_LEAVES,
    },
  },
  {
    id: "attendance",
    label: "الحضور والانصراف",
    cells: { manage: PERMISSIONS.MANAGE_ATTENDANCE },
  },
  { id: "users", label: "المستخدمون", cells: {} },
  {
    id: "settings",
    label: "الإعدادات",
    cells: { manage: PERMISSIONS.MANAGE_COMPANY_POLICY },
  },
  { id: "audit", label: "سجل العمليات", cells: {} },
  {
    id: "reports",
    label: "التقارير",
    cells: { view: PERMISSIONS.VIEW_REPORTS },
  },
  {
    id: "loans",
    label: "السلف",
    cells: { manage: PERMISSIONS.MANAGE_LOANS },
  },
  {
    id: "shifts",
    label: "الورديات",
    cells: { manage: PERMISSIONS.MANAGE_SHIFTS },
  },
  {
    id: "documents",
    label: "المستندات",
    cells: { manage: PERMISSIONS.MANAGE_DOCUMENTS },
  },
  {
    id: "requests",
    label: "الطلبات",
    cells: {
      approve: PERMISSIONS.APPROVE_REQUESTS,
      manage: PERMISSIONS.MANAGE_REQUESTS,
    },
  },
]
