"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { CalendarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/provider";
import { countBusinessDays, toISODate } from "@/lib/dates";
import { useAppData } from "@/lib/data/app-data";
import { getAnnualBalance, overlappingTeammates } from "@/lib/leave";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import type { LeaveType } from "@/lib/types";

function createSchema(messages: {
  chooseStart: string;
  chooseEnd: string;
  reasonMin: string;
  endAfterStart: string;
  selectManager: string;
}) {
  return z
    .object({
      leaveType: z.enum(["annual", "wfh", "sick"]),
      managerId: z.string().uuid({ error: messages.selectManager }),
      startDate: z.date({ error: messages.chooseStart }),
      endDate: z.date({ error: messages.chooseEnd }),
      reason: z.string().trim().min(8, messages.reasonMin),
    })
    .refine((value) => value.endDate >= value.startDate, {
      message: messages.endAfterStart,
      path: ["endDate"],
    });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

export function RequestForm({
  onCreated,
  defaultStartDate,
  defaultEndDate,
  lockStartDate = false,
}: {
  onCreated?: () => void;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  lockStartDate?: boolean;
}) {
  const { currentUser, profiles, requests, createRequest } = useAppData();
  const { m, t } = useI18n();
  const managers = profiles
    .filter((profile) => profile.role === "manager")
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const form = useForm<FormValues>({
    resolver: zodResolver(
      createSchema({
        chooseStart: m.requests.chooseStart,
        chooseEnd: m.requests.chooseEnd,
        reasonMin: m.requests.reasonMin,
        endAfterStart: m.requests.endAfterStart,
        selectManager: m.requests.selectManager,
      }),
    ),
    defaultValues: {
      leaveType: "annual",
      managerId: managers.length === 1 ? managers[0].id : "",
      startDate: defaultStartDate,
      endDate: defaultEndDate ?? defaultStartDate,
      reason: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const leaveType = form.watch("leaveType");

  const totalDays =
    startDate && endDate ? countBusinessDays(startDate, endDate) : 0;

  const overlaps = useMemo(() => {
    if (!currentUser || !startDate || !endDate || totalDays < 1) return [];
    return overlappingTeammates(
      requests,
      currentUser.id,
      toISODate(startDate),
      toISODate(endDate),
    );
  }, [startDate, endDate, totalDays, requests, currentUser]);

  if (!currentUser) return null;
  const balance = getAnnualBalance(currentUser, requests);

  const exceedsAnnual =
    leaveType === "annual" && totalDays > 0 && totalDays > balance.available;

  async function onSubmit(values: FormValues) {
    if (countBusinessDays(values.startDate, values.endDate) < 1) {
      form.setError("endDate", {
        message: m.requests.needWeekday,
      });
      return;
    }
    if (values.leaveType === "annual" && totalDays > balance.available) {
      form.setError("endDate", {
        message: t(
          balance.available === 1
            ? m.requests.remainingDays
            : m.requests.remainingDaysPlural,
          { count: balance.available },
        ),
      });
      return;
    }

    try {
      await createRequest({
        leaveType: values.leaveType,
        startDate: toISODate(values.startDate),
        endDate: toISODate(values.endDate),
        totalDays: countBusinessDays(values.startDate, values.endDate),
        reason: values.reason,
        managerId: values.managerId,
      });
      toastSuccess(m.toasts.requestSubmitted, m.toasts.requestSubmittedBody);
      if (overlaps.length > 0) toastWarning(m.toasts.coverage);
      form.reset({
        leaveType: "annual",
        managerId: managers.length === 1 ? managers[0].id : "",
        startDate: defaultStartDate,
        endDate: defaultEndDate ?? defaultStartDate,
        reason: "",
      });
      onCreated?.();
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : m.toasts.couldNotSubmit,
      );
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="leaveType">{m.requests.leaveType}</Label>
        <Controller
          control={form.control}
          name="leaveType"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as LeaveType)}
            >
              <SelectTrigger id="leaveType" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value ? m.leave[value as LeaveType] : m.requests.selectType
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">{m.leave.annual}</SelectItem>
                <SelectItem value="wfh">{m.leave.wfh}</SelectItem>
                <SelectItem value="sick">{m.leave.sick}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {leaveType === "annual" ? (
          <p className="text-xs text-muted-foreground">
            {t(m.requests.annualAvailable, {
              available: balance.available,
              allowance: balance.allowance,
              pending: balance.pending,
            })}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="managerId">{m.requests.manager}</Label>
        {managers.length === 0 ? (
          <p className="text-sm text-destructive">{m.requests.noManagers}</p>
        ) : (
          <Controller
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="managerId" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value
                        ? (managers.find((manager) => manager.id === value)
                            ?.fullName ?? m.requests.selectManager)
                        : m.requests.selectManager
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        {form.formState.errors.managerId ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.managerId.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{m.requests.startDate}</Label>
          {lockStartDate && startDate ? (
            <p className="flex h-10 items-center rounded-full border border-input px-3.5 text-sm">
              {format(startDate, "MMM d, yyyy")}
            </p>
          ) : (
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DateField
                  value={field.value}
                  onChange={(date) => {
                    field.onChange(date);
                    const currentEnd = form.getValues("endDate");
                    if (date && currentEnd && currentEnd < date) {
                      form.setValue("endDate", date);
                    }
                  }}
                />
              )}
            />
          )}
          {form.formState.errors.startDate ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>{m.requests.endDate}</Label>
          <Controller
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <DateField value={field.value} onChange={field.onChange} />
            )}
          />
          {form.formState.errors.endDate ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.endDate.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
        <span className="font-medium tabular-nums">{totalDays}</span>{" "}
        {t(
          totalDays === 1 ? m.dash.businessDays : m.dash.businessDaysPlural,
          { count: totalDays },
        )}
        <span className="text-muted-foreground">
          {" "}
          · {m.requests.weekendsExcluded}
        </span>
      </div>

      {exceedsAnnual ? (
        <p className="text-sm text-destructive">
          {t(m.requests.exceedsAnnual, { available: balance.available })}
        </p>
      ) : null}

      {overlaps.length > 0 ? (
        <p className="text-sm text-amber-800">
          {t(
            overlaps.length === 1
              ? m.requests.coverageWarning
              : m.requests.coverageWarningPlural,
            { count: overlaps.length },
          )}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="reason">{m.requests.reason}</Label>
        <Textarea
          id="reason"
          rows={4}
          placeholder={m.requests.reasonPlaceholder}
          {...form.register("reason")}
        />
        {form.formState.errors.reason ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.reason.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={exceedsAnnual || managers.length === 0}
      >
        {m.requests.submit}
      </Button>
    </form>
  );
}

function DateField({
  value,
  onChange,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}) {
  const { m } = useI18n();
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="w-full justify-start font-normal" />
        }
      >
        <CalendarIcon />
        {value ? format(value, "MMM d, yyyy") : m.requests.pickDate}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={{ dayOfWeek: [0, 6] }}
        />
      </PopoverContent>
    </Popover>
  );
}
