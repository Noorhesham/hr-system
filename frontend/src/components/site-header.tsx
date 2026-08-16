"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalculatorIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  href?: string
}

const HEADER_MENU_LINKS = [
  { title: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "الموظفون", href: "/employees", icon: UsersIcon },
  { title: "الحضور", href: "/attendance", icon: CalendarCheckIcon },
  { title: "الإجازات", href: "/leaves", icon: CalendarDaysIcon },
  { title: "الرواتب", href: "/payroll", icon: CalculatorIcon },
  { title: "الإعدادات", href: "/settings", icon: Settings2Icon },
] as const

function arabicInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "؟"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
  }
  return name.slice(0, 2)
}

function normalizeCrumbs(
  breadcrumbs: Array<string | BreadcrumbItem> | undefined,
  title: string,
): BreadcrumbItem[] {
  if (!breadcrumbs?.length) return [{ label: title }]
  return breadcrumbs.map((c) =>
    typeof c === "string" ? { label: c } : c,
  )
}

export function SiteHeader({
  title = "لوحة التحكم",
  breadcrumbs,
}: {
  title?: string
  /** Crumbs after «الصفحة الرئيسية». Strings or `{ label, href? }`. */
  breadcrumbs?: Array<string | BreadcrumbItem>
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const initials = arabicInitials(user?.fullName || user?.email)
  const crumbs = normalizeCrumbs(breadcrumbs, title)

  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center border-b border-border/70 bg-[#F8F9FA]/90 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Separator
            orientation="vertical"
            className="mx-1 h-5 md:hidden data-vertical:self-auto"
          />
          <div className="min-w-0">
            <nav
              aria-label="مسار التنقل"
              className="flex flex-wrap items-center gap-x-1 truncate text-xs text-muted-foreground"
            >
              <Link
                href="/dashboard"
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === "/dashboard" && "font-medium text-primary",
                )}
              >
                الصفحة الرئيسية
              </Link>
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1
                return (
                  <span key={`${c.label}-${i}`} className="inline-flex items-center gap-x-1">
                    <span className="text-muted-foreground/60">&gt;</span>
                    {c.href && !isLast ? (
                      <Link
                        href={c.href}
                        className={cn(
                          "transition-colors hover:text-primary",
                          pathname === c.href && "font-medium text-primary",
                        )}
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          isLast && "font-medium text-primary",
                        )}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {c.label}
                      </span>
                    )}
                  </span>
                )
              })}
            </nav>
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden w-56 md:block lg:w-72">
            <SearchIcon className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="اكتب ما تريد البحث عنه هنا..."
              className="h-9 rounded-lg border-border bg-white pe-9 text-sm"
            />
          </div>
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full border border-primary/20 bg-primary/15 p-0 hover:bg-primary/20"
                  aria-label="قائمة الحساب"
                />
              }
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52" sideOffset={8}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5 text-start">
                    <span className="text-sm font-medium">
                      {user?.fullName || "مستخدم"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {HEADER_MENU_LINKS.map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href))
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      className={cn(
                        active && "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary",
                      )}
                      render={<Link href={item.href} />}
                    >
                      <Icon className="size-4" />
                      {item.title}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  void logout()
                }}
              >
                <LogOutIcon className="size-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
