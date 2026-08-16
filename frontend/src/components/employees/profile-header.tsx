"use client"

import * as React from "react"
import {
  CalendarIcon,
  HashIcon,
  MailIcon,
  PhoneIcon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react"

import {
  ACCOUNT_STATUS_UI,
  EMPLOYMENT_TYPE_AR,
  arabicInitials,
  formatDateAr,
  type EmployeeDetail,
} from "@/components/employees/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ProfileHeaderProps = {
  employee: EmployeeDetail
  onEdit: () => void
  onToggleStatus: () => void
  onTerminate: () => void
  statusLoading?: boolean
  /** Renders below the header actions (e.g. profile tabs). */
  footer?: React.ReactNode
}

const STATUS_SELECT_LABEL: Record<"ACTIVE" | "INACTIVE", string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
}

export function EmployeeProfileHeader({
  employee,
  onEdit,
  onToggleStatus,
  onTerminate,
  statusLoading = false,
  footer,
}: ProfileHeaderProps) {
  const status = ACCOUNT_STATUS_UI[employee.accountStatus]
  const roleLabel = EMPLOYMENT_TYPE_AR[employee.employmentType] ?? "موظف"
  const subtitle = ["موظف", employee.position, employee.department, roleLabel]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(" · ")
  const accountValue = employee.isActive ? "ACTIVE" : "INACTIVE"

  return (
    <div className="rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-16 bg-primary/10 sm:size-20">
            {employee.photoUrl ? (
              <AvatarImage src={employee.photoUrl} alt={employee.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary sm:text-xl">
              {arabicInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-almarai text-xl font-bold tracking-tight sm:text-2xl">
                {employee.name}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
                  status.className,
                )}
              >
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
            </div>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MailIcon className="size-3.5 shrink-0" />
                {employee.email ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PhoneIcon className="size-3.5 shrink-0" />
                {employee.phone ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 shrink-0" />
                {formatDateAr(employee.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                <HashIcon className="size-3.5 shrink-0" />
                {employee.employeeCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            type="button"
            className="h-9 gap-2 rounded-lg"
            onClick={onEdit}
          >
            <SquarePenIcon className="size-4" />
            تعديل
          </Button>

          <Select
            value={accountValue}
            disabled={statusLoading}
            onValueChange={(v) => {
              if (v === null) return
              const nextActive = v === "ACTIVE"
              if (nextActive !== employee.isActive) onToggleStatus()
            }}
          >
            <SelectTrigger
              className={cn(
                "h-9! min-w-[10.5rem] rounded-lg font-medium",
                employee.isActive
                  ? "border-border bg-white"
                  : "border-muted-foreground/30 bg-muted text-muted-foreground",
              )}
            >
              <SelectValue>
                {(value: string | null) => {
                  const key =
                    value === "ACTIVE" || value === "INACTIVE"
                      ? value
                      : accountValue
                  return (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          key === "ACTIVE"
                            ? "bg-primary"
                            : "bg-muted-foreground",
                        )}
                      />
                      {STATUS_SELECT_LABEL[key]}
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  نشط
                </span>
              </SelectItem>
              <SelectItem value="INACTIVE">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-muted-foreground" />
                  غير نشط
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={!employee.isActive || statusLoading}
            onClick={onTerminate}
          >
            <Trash2Icon className="size-4" />
            إنهاء خدمة الموظف
          </Button>
        </div>
      </div>

      {footer ? (
        <div className="border-t border-border/70 px-5 pt-1 pb-0 sm:px-6">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
