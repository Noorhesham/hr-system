"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { COMPANY_OWNER_ROLE, PERMISSIONS, type PermissionAction } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboardIcon,
  UsersIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  MailIcon,
  InboxIcon,
  CalculatorIcon,
  BanknoteIcon,
  ChartBarIcon,
  ShieldIcon,
  Settings2Icon,
} from "lucide-react";

type NavItem = {
  title: string;
  /** Label shown to portal employees when different from admin title. */
  portalTitle?: string;
  url: string;
  icon: React.ReactNode;
  /** Any of these permissions unlocks the link. Empty = always visible when authenticated. */
  anyOf?: PermissionAction[];
  /** Portal employees only see these when true; admin-only when false. */
  portal?: boolean | "both";
};

type NavGroup = {
  label: string;
  /** Shown only to portal employees (self-service). */
  portalOnly?: boolean;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      {
        title: "لوحة التحكم",
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
        portal: "both",
      },
    ],
  },
  {
    label: "حسابي",
    portalOnly: true,
    items: [
      {
        title: "حضوري",
        url: "/attendance",
        icon: <CalendarCheckIcon />,
        portal: true,
      },
      {
        title: "إجازاتي",
        url: "/leaves",
        icon: <CalendarDaysIcon />,
        portal: true,
      },
      {
        title: "سلفتي",
        url: "/loans",
        icon: <BanknoteIcon />,
        portal: true,
      },
      {
        title: "طلباتي",
        url: "/my-requests",
        icon: <InboxIcon />,
        portal: true,
      },
    ],
  },
  {
    label: "إدارة الموارد البشرية",
    items: [
      {
        title: "الموظفون",
        url: "/employees",
        icon: <UsersIcon />,
        anyOf: [PERMISSIONS.VIEW_EMPLOYEE, PERMISSIONS.CREATE_EMPLOYEE],
        portal: false,
      },
      {
        title: "الأقسام",
        url: "/departments",
        icon: <Building2Icon />,
        anyOf: [PERMISSIONS.MANAGE_DEPARTMENTS, PERMISSIONS.VIEW_EMPLOYEE],
        portal: false,
      },
      {
        title: "الحضور و الانصراف",
        url: "/attendance",
        icon: <CalendarCheckIcon />,
        anyOf: [PERMISSIONS.MANAGE_ATTENDANCE],
        portal: false,
      },
      {
        title: "الاجازات",
        url: "/leaves",
        icon: <CalendarDaysIcon />,
        portal: false,
      },
    ],
  },
  {
    label: "الطلبات و الأذونات",
    items: [
      {
        title: "الطلبات",
        url: "/requests",
        icon: <MailIcon />,
        anyOf: [PERMISSIONS.MANAGE_REQUESTS, PERMISSIONS.APPROVE_REQUESTS],
        portal: false,
      },
      {
        title: "طلباتي",
        url: "/my-requests",
        icon: <InboxIcon />,
        portal: false,
      },
    ],
  },
  {
    label: "إدارة الموارد المالية",
    items: [
      {
        title: "الرواتب",
        url: "/payroll",
        icon: <CalculatorIcon />,
        anyOf: [PERMISSIONS.MANAGE_PAYROLL],
        portal: false,
      },
      {
        title: "السلف",
        url: "/loans",
        icon: <BanknoteIcon />,
        anyOf: [PERMISSIONS.MANAGE_LOANS],
        portal: false,
      },
    ],
  },
  {
    label: "إدارة التقارير و الملفات",
    items: [
      {
        title: "التقارير",
        url: "/reports",
        icon: <ChartBarIcon />,
        anyOf: [PERMISSIONS.VIEW_REPORTS],
        portal: false,
      },
    ],
  },
  {
    label: "إدارة النظام",
    items: [
      {
        title: "إدارة الأدوار و الصلاحيات",
        url: "/roles",
        icon: <ShieldIcon />,
        anyOf: [PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES],
        portal: false,
      },
      {
        title: "إعدادات النظام",
        url: "/settings",
        icon: <Settings2Icon />,
        anyOf: [PERMISSIONS.MANAGE_COMPANY_POLICY],
        portal: false,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const pathname = usePathname();

  const displayUser = {
    name: user?.fullName || user?.email?.split("@")[0] || "مستخدم",
    email: user?.jobTitle || user?.email || "",
    avatar: "",
  };

  const isPortal = Boolean(user?.isPortalUser);
  const isOwner = user?.roleName === COMPANY_OWNER_ROLE;

  const visibleGroups = NAV_GROUPS.map((group) => {
    if (group.portalOnly && !isPortal) {
      return { ...group, items: [] as NavItem[] };
    }
    return {
      ...group,
      items: group.items.filter((item) => {
        const portalMode = item.portal ?? false;
        if (isPortal) {
          return portalMode === true || portalMode === "both";
        }
        if (portalMode === true) return false;
        if (!item.anyOf?.length) return true;
        if (isOwner) return true;
        return can(item.anyOf);
      }),
    };
  }).filter((g) => g.items.length > 0);

  return (
    <Sidebar side="right" collapsible="offcanvas" className="border-s border-sidebar-border bg-[#F8F9FA]" {...props}>
      <SidebarHeader className="gap-0 border-b border-border/60 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex min-w-0 items-center px-1 py-1">
            <Image
              src="/logo2.png"
              alt="نجاز"
              width={140}
              height={44}
              priority
              className="h-9 w-auto object-contain object-right mix-blend-multiply"
            />
          </Link>
          <SidebarTrigger className="size-8 shrink-0 rounded-md border border-border bg-white" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-3">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-1 py-1">
            <SidebarGroupLabel className="mb-1 text-[11px] font-medium text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                  return (
                    <SidebarMenuItem key={`${group.label}-${item.url}`}>
                      <SidebarMenuButton
                        tooltip={item.portalTitle && isPortal ? item.portalTitle : item.title}
                        isActive={isActive}
                        render={<Link href={item.url} />}
                        className={cn(
                          "h-9 rounded-lg text-sm text-foreground/80",
                          isActive &&
                            "bg-primary/10 font-semibold text-primary data-active:bg-primary/10 data-active:text-primary",
                        )}
                      >
                        {item.icon}
                        <span>{item.portalTitle && isPortal ? item.portalTitle : item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2">
        <NavUser user={displayUser} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
