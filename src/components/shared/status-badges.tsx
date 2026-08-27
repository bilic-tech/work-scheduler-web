"use client";

import { cn } from "@/lib/utils";
import type { LeaveStatus, LeaveType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/provider";

const leaveTypeClass: Record<LeaveType, string> = {
  annual: "border-transparent bg-sky-500/12 text-sky-800",
  wfh: "border-transparent bg-violet-500/12 text-violet-800",
  sick: "border-transparent bg-amber-500/12 text-amber-800",
};

const statusClass: Record<LeaveStatus, string> = {
  pending: "border-transparent bg-primary/10 text-primary",
  approved: "border-transparent bg-emerald-500/12 text-emerald-800",
  rejected: "border-transparent bg-rose-500/12 text-rose-800",
};

const roleClass: Record<string, string> = {
  employee: "border-transparent bg-primary/10 text-primary",
  manager: "border-transparent bg-primary text-primary-foreground",
  accounting: "border-transparent bg-violet-500/12 text-violet-800",
};

export function LeaveTypeBadge({ type }: { type: LeaveType }) {
  const { m } = useI18n();
  return (
    <Badge variant="outline" className={cn("capitalize", leaveTypeClass[type])}>
      {m.leave[type]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const { m } = useI18n();
  return (
    <Badge variant="outline" className={cn("capitalize", statusClass[status])}>
      {m.status[status]}
    </Badge>
  );
}

export function RoleBadge({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const { m } = useI18n();
  const label =
    role === "employee" || role === "manager" || role === "accounting"
      ? m.roles[role]
      : role;
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", roleClass[role], className)}
    >
      {label}
    </Badge>
  );
}
