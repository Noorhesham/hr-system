"use client"

import { Pie, PieChart, Cell } from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DashboardPayload } from "@/components/dashboard/types"

const chartConfig = {
  onTime: { label: "في الموعد", color: "var(--primary)" },
  late: { label: "متأخر", color: "#f97316" },
  absent: { label: "غائب", color: "#ef4444" },
} satisfies ChartConfig

export function DashboardAttendanceDonut({
  data,
}: {
  data: DashboardPayload["attendanceToday"]
}) {
  const slices = [
    { key: "onTime", value: data.onTime, fill: "var(--color-onTime)" },
    { key: "late", value: data.late, fill: "var(--color-late)" },
    { key: "absent", value: data.absent, fill: "var(--color-absent)" },
  ].filter((s) => s.value > 0)

  const chartData =
    slices.length > 0
      ? slices
      : [{ key: "onTime", value: 1, fill: "var(--color-onTime)" }]

  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <CardTitle className="font-almarai text-base">
          نظرة عامة على الحضور
        </CardTitle>
        <Badge
          variant="secondary"
          className="rounded-full bg-primary/10 text-primary"
        >
          {data.checkedIn.toLocaleString("en-US")} سجلوا حضورهم
        </Badge>
      </CardHeader>
      <CardContent className="relative flex items-center justify-center pt-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[200px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="key"
              innerRadius={58}
              outerRadius={80}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-6">
          <span className="font-almarai text-2xl font-bold text-primary">
            {data.onTimeRate}%
          </span>
          <span className="text-xs text-muted-foreground">في الموعد</span>
        </div>
      </CardContent>
      <CardFooter className="justify-around border-t border-border/60 pt-4 text-center text-sm">
        <div>
          <p className="text-muted-foreground">حاضر</p>
          <p className="font-semibold tabular-nums">{data.checkedIn}</p>
        </div>
        <div>
          <p className="text-muted-foreground">متأخر</p>
          <p className="font-semibold tabular-nums text-orange-600">
            {data.late}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">غائب</p>
          <p className="font-semibold tabular-nums text-destructive">
            {data.absent}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
