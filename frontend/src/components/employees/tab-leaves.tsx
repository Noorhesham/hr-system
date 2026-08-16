"use client"

import {
  LEAVE_STATUS_AR,
  formatDateAr,
  type LeaveRow,
} from "@/components/employees/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-primary/10 text-primary border-transparent",
  PENDING: "bg-orange-100 text-orange-700 border-transparent",
  REJECTED: "bg-destructive/10 text-destructive border-transparent",
}

type TabLeavesProps = {
  leaves: LeaveRow[]
  loading?: boolean
}

export function TabLeaves({ leaves, loading }: TabLeavesProps) {
  const year = new Date().getFullYear()
  const approvedDays = leaves
    .filter(
      (l) =>
        l.status === "APPROVED" &&
        new Date(l.fromDate).getFullYear() === year,
    )
    .reduce((s, l) => s + l.days, 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/80 bg-white px-5 py-4 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
        <p className="text-sm text-muted-foreground">
          رصيد الإجازات المعتمدة لعام {year}
        </p>
        <p className="mt-1 font-almarai text-2xl font-bold tabular-nums">
          {approvedDays} يوم
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          مجموع أيام الطلبات الموافق عليها (لا يوجد رصيد سنوي منفصل في النظام
          حاليًا)
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>النوع</TableHead>
              <TableHead>من</TableHead>
              <TableHead>إلى</TableHead>
              <TableHead>الأيام</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-28 text-center text-muted-foreground"
                >
                  لا توجد طلبات إجازة
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.type}</TableCell>
                  <TableCell>{formatDateAr(l.fromDate)}</TableCell>
                  <TableCell>{formatDateAr(l.toDate)}</TableCell>
                  <TableCell className="tabular-nums">{l.days}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-medium",
                        STATUS_STYLE[l.status],
                      )}
                    >
                      {LEAVE_STATUS_AR[l.status] ?? l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
