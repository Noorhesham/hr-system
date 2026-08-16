"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DashboardPayload } from "@/components/dashboard/types"

const chartConfig = {
  gross: { label: "الإجمالي", color: "var(--primary)" },
  net: { label: "الصافي", color: "#86efac" },
} satisfies ChartConfig

export function DashboardSalaryChart({
  data,
  periodLabel,
}: {
  data: DashboardPayload["salarySummary"]
  periodLabel?: string | null
}) {
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="font-almarai text-base">ملخص الرواتب</CardTitle>
        <CardDescription>
          الإجمالي مقابل الصافي
          {periodLabel ? `، ${periodLabel}` : "، الفترة المحددة"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            لا توجد دورات رواتب بعد
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fillGross" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-gross)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-gross)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fillNet" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-net)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-net)"
                    stopOpacity={0.08}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v) =>
                  typeof v === "number" ? `${Math.round(v / 1000)}ك` : ""
                }
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="gross"
                type="monotone"
                fill="url(#fillGross)"
                stroke="var(--color-gross)"
                strokeWidth={2}
              />
              <Area
                dataKey="net"
                type="monotone"
                fill="url(#fillNet)"
                stroke="var(--color-net)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
