import type { LucideIcon } from "@/components/icons";
import type { ReactNode } from "react";

import { Sparkline } from "@/components/shared/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
  sparkline,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  featured?: boolean;
  sparkline?: number[];
}) {
  return (
    <Card
      className={cn(
        featured &&
          "bg-gradient-to-br from-primary to-[oklch(0.42_0.13_250)] text-primary-foreground ring-0 shadow-lg shadow-primary/20",
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm font-medium",
              featured ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          {Icon ? (
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                featured
                  ? "bg-white/15 text-primary-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>
        <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {sparkline ? (
          <Sparkline
            values={sparkline}
            className={featured ? "text-white" : "text-primary"}
          />
        ) : null}
        {hint ? (
          <p
            className={cn(
              "text-xs",
              featured ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PersonRow({
  name,
  meta,
  trailing,
  action,
  initials: letters,
  rank,
}: {
  name: string;
  meta?: string;
  trailing?: ReactNode;
  action?: ReactNode;
  initials: string;
  rank?: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-1 py-2">
      <div className="relative">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-bold">
          {letters}
        </span>
        {rank != null ? (
          <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {rank}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        {meta ? (
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="text-right text-sm font-semibold tabular-nums">
          {trailing}
        </div>
      ) : null}
      {action}
    </div>
  );
}
