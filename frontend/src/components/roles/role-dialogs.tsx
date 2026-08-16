"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  InfoIcon,
  Loader2Icon,
} from "lucide-react"

import { Combobox } from "@/components/form/Combobox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { roleLabelAr, type RoleRow, type RoleUserRow } from "@/lib/roles"
import { cn } from "@/lib/utils"

export function ProtectedRoleDialog({
  open,
  onOpenChange,
  roleName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleName: string
}) {
  const label = roleLabelAr(roleName)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-sky-100">
            <InfoIcon className="size-7 text-sky-600" />
          </div>
          <h2 className="font-almarai text-lg font-bold">
            لا يمكن حذف هذا الدور
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            أدوار النظام الأساسية محمية ولا يمكن تعديلها أو إزالتها.
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 px-4 py-3 text-start text-sm leading-6 text-muted-foreground">
          الدور «{label}» هو دور نظام محمي بشكل افتراضي ومطلوب لضمان تشغيل
          الصلاحيات الأساسية للمنشأة. لا يمكن حذفه للحفاظ على سلامة بنية النظام
          الإداري والمالي.
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            إغلاق
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            فهمت ذلك
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  users,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleRow | null
  users: RoleUserRow[]
  loading?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const [typed, setTyped] = React.useState("")
  const label = role ? roleLabelAr(role.name) : ""
  const departments = React.useMemo(() => {
    const names = users
      .map((u) => u.department?.trim())
      .filter((d): d is string => Boolean(d))
    return [...new Set(names)]
  }, [users])

  React.useEffect(() => {
    if (open) setTyped("")
  }, [open, role?.id])

  const matches = typed.trim() === label
  const count = role?.userCount ?? users.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogHeader className="pe-8">
          <DialogTitle className="font-almarai text-base font-bold">
            حذف دور «{label}»
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangleIcon className="size-7 text-red-600" />
          </div>
          <h3 className="font-almarai text-lg font-bold text-red-600">
            حذف دور «{label}»
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            يرجى الانتباه إلى تأثيرات هذا الإجراء على النظام والمستخدمين
            المعنيين
          </p>
        </div>

        <div className="rounded-xl bg-red-50 px-4 py-3 text-start">
          <p className="text-sm font-bold text-red-600">
            سيتم إزالة هذا الدور من {count} مستخدماً
          </p>
          <p className="mt-1 text-xs leading-5 text-red-700/80">
            سيتم سحب جميع الصلاحيات المرتبطة بهذا الدور فوراً، ولن يتمكن
            الموظفون المتأثرون من اعتماد الحضور أو الإجازات أو الطلبات المرتبطة
            به.
          </p>
        </div>

        {departments.length > 0 ? (
          <div className="text-start">
            <p className="mb-1.5 text-sm font-medium">الأقسام المتأثرة:</p>
            <ul className="list-disc space-y-1 pe-5 text-sm text-red-600">
              {departments.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-1.5 text-start">
          <Label>
            اكتب اسم الدور للتأكيد
            <span className="text-destructive">*</span>
          </Label>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={label}
            className="h-10 rounded-lg"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            الغاء
          </Button>
          <Button
            type="button"
            disabled={!matches || loading}
            className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/40"
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "حذف الدور نهائياً"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  loading,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleRow | null
  loading?: boolean
  onSubmit: (values: {
    name: string
    description: string
    isActive: boolean
  }) => void | Promise<void>
}) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    if (!open) return
    if (role) {
      setName(roleLabelAr(role.name))
      setDescription(role.description ?? "")
      setIsActive(role.isActive)
    } else {
      setName("")
      setDescription("")
      setIsActive(true)
    }
  }, [open, role])

  const nameLocked = Boolean(role?.isLocked || role?.isSystem)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-almarai">
            {role ? "تعديل الدور" : "إضافة دور جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              اسم الدور
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={nameLocked}
              className="h-10 rounded-lg"
              placeholder="مثال: مشرف الحضور"
            />
          </div>
          <div className="space-y-1.5">
            <Label>الوصف</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 rounded-lg"
              placeholder="وصف مختصر لمسؤوليات هذا الدور"
            />
          </div>
          {role ? (
            <div className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2">
              <Label htmlFor="role-active">الدور نشط</Label>
              <Switch
                id="role-active"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(v === true)}
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg"
            disabled={loading || !name.trim()}
            onClick={() =>
              void onSubmit({
                name: name.trim(),
                description: description.trim(),
                isActive,
              })
            }
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : role ? (
              "حفظ التعديلات"
            ) : (
              "إنشاء الدور"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AssignUserDialog({
  open,
  onOpenChange,
  users,
  loading,
  onAssign,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: { id: string; email: string; fullName: string | null; roleName: string }[]
  loading?: boolean
  onAssign: (userId: string) => void | Promise<void>
}) {
  const [userId, setUserId] = React.useState("")

  React.useEffect(() => {
    if (open) setUserId("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-almarai">تعيين موظف لهذا الدور</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>الموظف</Label>
          <Combobox
            value={userId}
            onValueChange={setUserId}
            placeholder="اختر موظفاً"
            searchPlaceholder="بحث بالاسم أو الإيميل..."
            emptyText="لا يوجد موظفون"
            className="h-10!"
            options={users.map((u) => ({
              value: u.id,
              label: `${u.fullName || u.email} (${roleLabelAr(u.roleName)})`,
            }))}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg"
            disabled={!userId || loading}
            onClick={() => void onAssign(userId)}
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "تعيين"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function UnassignUsersDialog({
  open,
  onOpenChange,
  count,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  loading?: boolean
  onConfirm: () => void | Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-almarai">
            {count > 1
              ? `حذف ${count} موظفين من الدور؟`
              : "حذف الموظف من الدور؟"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          سيتم نقل {count > 1 ? "هؤلاء الموظفين" : "هذا الموظف"} إلى دور الموظف
          الأساسي وإزالة صلاحيات هذا الدور فوراً.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={loading}
            className={cn(
              "h-10 rounded-lg bg-red-600 text-white hover:bg-red-700",
            )}
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : count > 1 ? (
              "حذف الموظفين من الدور"
            ) : (
              "حذف الموظف"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
