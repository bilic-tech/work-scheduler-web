"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { hr as hrLocale } from "date-fns/locale";
import { useMemo, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { RequestForm } from "@/components/requests/request-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UNDERSTAFF_THRESHOLD } from "@/lib/constants";
import { formatRange } from "@/lib/dates";
import { useAppData } from "@/lib/data/app-data";
import { initials, requestsOnDate } from "@/lib/leave";
import { canCreateRequests } from "@/lib/rbac";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type { LeaveRequestWithProfile, LeaveStatus } from "@/lib/types";

const TYPE_DOT: Record<string, string> = {
  annual: "bg-sky-500",
  wfh: "bg-violet-500",
  sick: "bg-amber-500",
};

export function MonthCalendar({
  requests,
  readOnly = false,
  personalUserId,
}: {
  requests: LeaveRequestWithProfile[];
  readOnly?: boolean;
  personalUserId?: string;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const { currentUser } = useAppData();
  const { m, t, locale } = useI18n();
  const dateLocale = locale === "hr" ? hrLocale : undefined;
  const canPickDate =
    !readOnly &&
    Boolean(currentUser) &&
    canCreateRequests(currentUser?.role ?? "employee");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const scoped = personalUserId
    ? requests.filter((request) => request.userId === personalUserId)
    : requests;

  return (
    <>
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(15_15_15/0.04)] ring-1 ring-black/4">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="font-bold">
            {format(month, "MMMM yyyy", { locale: dateLocale })}
          </p>
          <p className="text-xs text-muted-foreground">
            {readOnly ? m.calendar.readOnly : m.calendar.weekendsNote}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((value) => subMonths(value, 1))}
            aria-label={m.calendar.previousMonth}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            {m.calendar.today}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((value) => addMonths(value, 1))}
            aria-label={m.calendar.nextMonth}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {[
          m.weekdays.mon,
          m.weekdays.tue,
          m.weekdays.wed,
          m.weekdays.thu,
          m.weekdays.fri,
          m.weekdays.sat,
          m.weekdays.sun,
        ].map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const events = isWeekend(day)
            ? []
            : requestsOnDate(scoped, day, ["approved", "pending"]);
          const approvedCount = events.filter(
            (event) => event.status === "approved",
          ).length;
          const understaffed = !personalUserId && approvedCount >= UNDERSTAFF_THRESHOLD;
          const inMonth = isSameMonth(day, month);

          const canOpen =
            canPickDate && inMonth && !isWeekend(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 border-t border-r p-1.5 last:border-r-0",
                !inMonth && "bg-muted/20 text-muted-foreground",
                isWeekend(day) && "bg-muted/30",
                understaffed && "bg-amber-500/8",
                canOpen && "cursor-pointer hover:bg-primary/5",
              )}
              onClick={canOpen ? () => setPickedDate(day) : undefined}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    isToday(day) &&
                      "bg-primary text-primary-foreground font-medium",
                  )}
                >
                  {format(day, "d")}
                </span>
                {understaffed ? (
                  <span className="rounded bg-amber-500/15 px-1 text-[10px] font-medium text-amber-800">
                    {m.calendar.busy}
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map((event) => (
                  <CalendarChip key={event.id} event={event} />
                ))}
                {events.length > 3 ? (
                  <p className="px-1 text-[10px] text-muted-foreground">
                    {t(m.calendar.more, { count: events.length - 3 })}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
        <LegendDot className="bg-sky-500" label={m.leave.annual} />
        <LegendDot className="bg-violet-500" label={m.leave.wfh} />
        <LegendDot className="bg-amber-500" label={m.leave.sick} />
        <span className="ml-auto">{m.calendar.dashedPending}</span>
      </div>
    </div>
    <Dialog
      open={Boolean(pickedDate)}
      onOpenChange={(open) => {
        if (!open) setPickedDate(null);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {pickedDate
              ? t(m.calendar.pickDate, {
                  date: format(pickedDate, "d MMMM yyyy", {
                    locale: dateLocale,
                  }),
                })
              : m.requests.newTitle}
          </DialogTitle>
          <DialogDescription>{m.calendar.pickDateBody}</DialogDescription>
        </DialogHeader>
        {pickedDate ? (
          <RequestForm
            key={pickedDate.toISOString()}
            defaultStartDate={pickedDate}
            defaultEndDate={pickedDate}
            lockStartDate
            onCreated={() => setPickedDate(null)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}

function CalendarChip({ event }: { event: LeaveRequestWithProfile }) {
  const pending = event.status === "pending";
  const { m } = useI18n();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium",
              event.leaveType === "annual" && "bg-sky-500/12 text-sky-900",
              event.leaveType === "wfh" && "bg-violet-500/12 text-violet-900",
              event.leaveType === "sick" && "bg-amber-500/12 text-amber-900",
              pending && "ring-1 ring-dashed ring-current/40",
            )}
          />
        }
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", TYPE_DOT[event.leaveType])} />
        <span className="truncate">
          {event.profile.fullName.split(" ")[0]} · {initials(event.profile.fullName)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{event.profile.fullName}</p>
        <p>
          {m.leave[event.leaveType]} · {formatRange(event.startDate, event.endDate)}
        </p>
        <p className="capitalize opacity-80">{m.status[event.status as LeaveStatus]}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}
