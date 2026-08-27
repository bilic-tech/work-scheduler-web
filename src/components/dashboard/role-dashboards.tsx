"use client";

import Link from "next/link";
import {
  CalendarDaysIcon,
  ClipboardCheckIcon,
  PalmtreeIcon,
  TimerIcon,
} from "@/components/icons";
import { useMemo, useState } from "react";

import { MonthCalendar } from "@/components/calendar/month-calendar";
import { ReviewDialog } from "@/components/requests/review-dialog";
import { MetricCard, PersonRow } from "@/components/shared/metric-card";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { LeaveTypeBadge, StatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRange } from "@/lib/dates";
import { useAppData } from "@/lib/data/app-data";
import { departmentLabel } from "@/lib/departments";
import { getAnnualBalance, initials, monthlyBreakdown } from "@/lib/leave";
import { useI18n } from "@/i18n/provider";
import type { LeaveRequest, LeaveRequestWithProfile, Profile } from "@/lib/types";

function withProfiles(
  requests: LeaveRequest[],
  profiles: Profile[],
): LeaveRequestWithProfile[] {
  return requests
    .map((request) => ({
      ...request,
      profile: profiles.find((profile) => profile.id === request.userId)!,
      assignedManager: request.assignedManagerId
        ? profiles.find((profile) => profile.id === request.assignedManagerId)
        : null,
      reviewer: request.reviewedBy
        ? profiles.find((profile) => profile.id === request.reviewedBy)
        : null,
    }))
    .filter((request) => Boolean(request.profile));
}

export function EmployeeDashboard() {
  const store = useAppData();
  const { m, t } = useI18n();
  if (!store.currentUser) return null;
  const mine = store.visibleRequests;
  const balance = getAnnualBalance(store.currentUser, store.requests);
  const pending = mine.filter((request) => request.status === "pending").length;
  const upcoming = mine.filter(
    (request) =>
      request.status !== "rejected" &&
      request.endDate >= new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={t(m.dash.welcomeBack, {
          name: store.currentUser.fullName.split(" ")[0],
        })}
        description={m.dash.employeeBody}
        action={
          <Button nativeButton={false} render={<Link href="/requests" />}>
            {m.dash.newRequest}
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          featured
          label={m.dash.daysRemaining}
          value={`${balance.remaining}/${balance.allowance}`}
          hint={t(m.dash.usedPending, {
            used: balance.used,
            pending: balance.pending,
          })}
          icon={PalmtreeIcon}
          sparkline={[4, 6, 5, 8, 7, balance.used || 1]}
        />
        <MetricCard
          label={m.dash.pending}
          value={pending}
          hint={m.dash.waitingReview}
          icon={TimerIcon}
        />
        <MetricCard
          label={m.dash.upcoming}
          value={upcoming.length}
          hint={m.dash.upcomingHint}
          icon={CalendarDaysIcon}
        />
        <MetricCard
          label={m.dash.department}
          value={departmentLabel(
            store.currentUser.department,
            m.departments,
          )}
          hint={store.currentUser.email}
          icon={ClipboardCheckIcon}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <MonthCalendar requests={mine} personalUserId={store.currentUser.id} />
        <Card>
          <CardHeader>
            <CardTitle>{m.dash.yourRequests}</CardTitle>
            <CardDescription>{m.dash.yourRequestsBody}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {mine.length === 0 ? (
              <EmptyState
                title={m.dash.noRequests}
                description={m.dash.noRequestsBody}
              />
            ) : (
              mine.slice(0, 5).map((request, index) => (
                <PersonRow
                  key={request.id}
                  rank={index + 1}
                  initials={initials(request.profile.fullName)}
                  name={formatRange(request.startDate, request.endDate)}
                  meta={t(
                    request.totalDays === 1
                      ? m.dash.businessDays
                      : m.dash.businessDaysPlural,
                    { count: request.totalDays },
                  )}
                  trailing={<StatusBadge status={request.status} />}
                  action={<LeaveTypeBadge type={request.leaveType} />}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ManagerDashboard() {
  const store = useAppData();
  const { m, t } = useI18n();
  const all = useMemo(
    () => withProfiles(store.requests, store.profiles),
    [store.requests, store.profiles],
  );
  const pending = all.filter((request) => request.status === "pending");
  const [selected, setSelected] = useState<LeaveRequestWithProfile | null>(
    null,
  );
  const employees = store.profiles.filter(
    (profile) => profile.role !== "accounting",
  );
  if (!store.currentUser) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={m.dash.approvalsTitle}
        description={m.dash.approvalsBody}
        action={
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/team-calendar" />}
          >
            {m.dash.openTeamCalendar}
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          featured
          label={m.dash.pendingApprovals}
          value={pending.length}
          hint={m.dash.actionNeeded}
          icon={ClipboardCheckIcon}
          sparkline={[1, 2, 2, 4, 3, pending.length || 1]}
        />
        <MetricCard
          label={m.dash.teamMembers}
          value={employees.length}
          hint={m.dash.peopleWithBalances}
          icon={CalendarDaysIcon}
        />
        <MetricCard
          label={m.dash.approvedThisYear}
          value={all.filter((request) => request.status === "approved").length}
          hint={m.dash.allLeaveTypes}
          icon={PalmtreeIcon}
        />
        <MetricCard
          label={m.dash.rejected}
          value={all.filter((request) => request.status === "rejected").length}
          hint={m.dash.rejectedHint}
          icon={TimerIcon}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{m.dash.needsDecision}</CardTitle>
            <CardDescription>{m.dash.needsDecisionBody}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {pending.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheckIcon className="size-5" />}
                title={m.dash.noPending}
                description={m.dash.noPendingBody}
              />
            ) : (
              pending.map((request, index) => (
                <PersonRow
                  key={request.id}
                  rank={index + 1}
                  initials={initials(request.profile.fullName)}
                  name={request.profile.fullName}
                  meta={`${formatRange(request.startDate, request.endDate)} · ${request.totalDays}d`}
                  trailing={<LeaveTypeBadge type={request.leaveType} />}
                  action={
                    <Button size="sm" onClick={() => setSelected(request)}>
                      {m.dash.review}
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{m.dash.leaveBalances}</CardTitle>
            <CardDescription>{m.dash.leaveBalancesBody}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {employees.map((profile, index) => {
              const balance = getAnnualBalance(profile, store.requests);
              return (
                <PersonRow
                  key={profile.id}
                  rank={index + 1}
                  initials={initials(profile.fullName)}
                  name={profile.fullName}
                  meta={departmentLabel(profile.department, m.departments)}
                  trailing={
                    <span>
                      {balance.remaining}/{balance.allowance}
                      <span className="block text-xs font-medium text-muted-foreground">
                        {t(m.dash.pendingCount, { count: balance.pending })}
                      </span>
                    </span>
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      </div>
      <ReviewDialog
        request={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}

export function AccountingDashboard() {
  const store = useAppData();
  const { m, locale } = useI18n();
  if (!store.currentUser) return null;
  const approved = store.visibleRequests;
  const now = new Date();
  const rows = monthlyBreakdown(
    store.profiles,
    store.requests,
    now.getFullYear(),
    now.getMonth() + 1,
  );
  const monthTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={m.dash.payrollTitle}
        description={m.dash.payrollBody}
        action={
          <Button nativeButton={false} render={<Link href="/reports" />}>
            {m.dash.openReports}
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          featured
          label={m.dash.approvedRecords}
          value={approved.length}
          hint={m.dash.approvedRecordsHint}
          icon={ClipboardCheckIcon}
        />
        <MetricCard
          label={m.dash.daysThisMonth}
          value={monthTotal}
          hint={m.dash.daysThisMonthHint}
          icon={CalendarDaysIcon}
        />
        <MetricCard
          label={m.dash.peopleWithLeave}
          value={rows.filter((row) => row.total > 0).length}
          hint={now.toLocaleString(locale, { month: "long", year: "numeric" })}
          icon={PalmtreeIcon}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{m.dash.thisMonthByType}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {rows.map((row, index) => (
            <PersonRow
              key={row.userId}
              rank={index + 1}
              initials={initials(row.fullName)}
              name={row.fullName}
              meta={departmentLabel(row.department, m.departments)}
              trailing={
                <span>
                  {row.total}
                  <span className="block text-xs font-medium text-muted-foreground">
                    {row.annual}a · {row.sick}s · {row.wfh}w
                  </span>
                </span>
              }
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
