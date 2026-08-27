"use client";

import { BellIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppData } from "@/lib/data/app-data";
import { useI18n } from "@/i18n/provider";
import { toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const { m } = useI18n();
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppData();

  async function onMarkAll() {
    await markAllNotificationsRead();
    toastSuccess(m.toasts.markedRead);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={m.notify.title}
          />
        }
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 min-w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>{m.notify.title}</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs font-semibold text-primary"
              onClick={() => void onMarkAll()}
            >
              {m.notify.markAll}
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {m.notify.empty}
          </p>
        ) : (
          notifications.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={cn(
                "cursor-pointer items-start py-2",
                !item.readAt && "bg-primary/5",
              )}
              onClick={() => {
                if (!item.readAt) void markNotificationRead(item.id);
                router.push(item.href || "/dashboard");
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.title}</span>
                <span className="block text-xs whitespace-normal text-muted-foreground">
                  {item.body}
                </span>
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
