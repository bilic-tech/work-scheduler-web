"use client";

import { MenuIcon } from "@/components/icons";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { RoleBadge } from "@/components/shared/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppData } from "@/lib/data/app-data";
import { initials } from "@/lib/leave";
import { useI18n } from "@/i18n/provider";

export function TopNav() {
  const { currentUser } = useAppData();
  const { m } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-transparent">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={m.nav.openNav}
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {currentUser?.fullName ?? "Leavewise"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser?.email ?? ""}
          </p>
        </div>
        {currentUser ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <RoleBadge role={currentUser.role} />
              <Avatar size="sm">
                <AvatarFallback>{initials(currentUser.fullName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        ) : null}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{m.nav.dashboard}</SheetTitle>
          </SheetHeader>
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
