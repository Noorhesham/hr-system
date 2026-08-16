"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardPayload } from "@/components/dashboard/types"
import { cn } from "@/lib/utils"

const BAR_COLORS = [
  "bg-sky-500",
  "bg-primary",
  "bg-orange-500",
  "bg-violet-500",
  "bg-rose-500",
]

export function DashboardDepartmentBars({
  data,
}: {
  data: DashboardPayload["employeesByDepartment"]
}) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="font-almarai text-base">
          إحصائيات الموظفين حسب القسم
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا يوجد موظفون بعد
          </p>
        ) : (
          <div className="max-h-72 space-y-4 overflow-y-auto pe-1">
            {data.map((row, i) => (
              <div key={row.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.department}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      BAR_COLORS[i % BAR_COLORS.length],
                    )}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
