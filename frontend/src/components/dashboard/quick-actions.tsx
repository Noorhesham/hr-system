"use client"

import Link from "next/link"
import {
  UserPlusIcon,
  Building2Icon,
  CalendarCheckIcon,
  ShieldIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const ACTIONS = [
  {
    title: "إضافة موظف جديد",
    href: "/employees/new",
    icon: UserPlusIcon,
  },
  {
    title: "إدارة الأقسام",
    href: "/departments",
    icon: Building2Icon,
  },
  {
    title: "اعتماد الإجازات",
    href: "/leaves",
    icon: CalendarCheckIcon,
  },
  {
    title: "إدارة الأدوار",
    href: "/roles",
    icon: ShieldIcon,
  },
] as const

export function DashboardQuickActions() {
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="font-almarai text-base">إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.href + a.title}
                href={a.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-5 text-center text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                {a.title}
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
