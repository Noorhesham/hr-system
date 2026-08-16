"use client"

import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  arabicInitials,
  type DashboardLeaveStatus,
  type DashboardPayload,
} from "@/components/dashboard/types"

const STATUS_UI: Record<
  DashboardLeaveStatus,
  { label: string; className: string }
> = {
  APPROVED: {
    label: "موافق عليها",
    className: "bg-primary/15 text-primary hover:bg-primary/15",
  },
  PENDING: {
    label: "معلق",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  REJECTED: {
    label: "مرفوضة",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
}

export function DashboardLeaveList({
  data,
}: {
  data: DashboardPayload["recentLeaveRequests"]
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-almarai text-base">طلبات الاجازة</CardTitle>
        <Link
          href="/leaves"
          className="text-xs font-medium text-primary hover:underline"
        >
          عرض الكل
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا توجد طلبات إجازة
          </p>
        ) : (
          data.map((row) => {
            const ui = STATUS_UI[row.status]
            return (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5"
              >
                <Avatar className="size-9 bg-primary/10">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {arabicInitials(row.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {row.employeeName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.position || "—"}
                  </p>
                </div>
                <Badge className={ui.className}>{ui.label}</Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
