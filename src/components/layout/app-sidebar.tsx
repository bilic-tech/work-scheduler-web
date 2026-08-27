"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ClipboardListIcon,
  FileBarChartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UsersIcon,
} from "@/components/icons";

import { signOutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { RoleBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { departmentLabel } from "@/lib/departments";
import { cn } from "@/lib/utils";
import { useAppData } from "@/lib/data/app-data";
import { useI18n } from "@/i18n/provider";
import type { UserRole } from "@/lib/types";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { currentUser } = useAppData();
  const { m } = useI18n();
  if (!currentUser) return null;

  const nav: Record<
    UserRole,
    { href: string; label: string; icon: typeof LayoutDashboardIcon }[]
  > = {
    employee: [
      { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboardIcon },
      { href: "/requests", label: m.nav.myRequests, icon: ClipboardListIcon },
    ],
    manager: [
      { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboardIcon },
      { href: "/requests", label: m.nav.approvals, icon: ClipboardListIcon },
      { href: "/team-calendar", label: m.nav.teamCalendar, icon: CalendarDaysIcon },
      { href: "/team", label: m.nav.team, icon: UsersIcon },
    ],
    accounting: [
      { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboardIcon },
      { href: "/team-calendar", label: m.nav.calendar, icon: CalendarDaysIcon },
      { href: "/reports", label: m.nav.reports, icon: FileBarChartIcon },
    ],
  };
  const items = nav[currentUser.role] ?? nav.employee;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 p-4">
        <div className="rounded-3xl bg-muted/70 p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {m.nav.signedInAs}
          </p>
          <p className="mt-1 truncate text-sm font-bold">{currentUser.fullName}</p>
          <div className="mt-2 flex items-center gap-2">
            <RoleBadge role={currentUser.role} />
            <span className="truncate text-xs text-muted-foreground">
              {departmentLabel(currentUser.department, m.departments)}
            </span>
          </div>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            <LogOutIcon />
            {m.nav.signOut}
          </Button>
        </form>
      </div>
    </div>
  );
}
