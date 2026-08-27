"use client";

import { ClipboardListIcon } from "@/components/icons";
import { useMemo, useState } from "react";

import { ReviewDialog } from "@/components/requests/review-dialog";
import { EmptyState } from "@/components/shared/page-header";
import { LeaveTypeBadge, StatusBadge } from "@/components/shared/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDisplayDate, formatRange } from "@/lib/dates";
import { useAppData } from "@/lib/data/app-data";
import { departmentLabel } from "@/lib/departments";
import { initials } from "@/lib/leave";
import { canReviewRequests } from "@/lib/rbac";
import { useI18n } from "@/i18n/provider";
import type { LeaveRequestWithProfile, LeaveStatus } from "@/lib/types";

type Filter = "all" | LeaveStatus;

export function RequestTable({
  requests,
  showEmployee = true,
}: {
  requests: LeaveRequestWithProfile[];
  showEmployee?: boolean;
}) {
  const { currentUser } = useAppData();
  const { m } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<LeaveRequestWithProfile | null>(null);
  const canReview = canReviewRequests(currentUser?.role ?? "employee");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? requests
        : requests.filter((request) => request.status === filter),
    [requests, filter],
  );

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList>
          <TabsTrigger value="all">{m.requests.all}</TabsTrigger>
          <TabsTrigger value="pending">{m.status.pending}</TabsTrigger>
          <TabsTrigger value="approved">{m.status.approved}</TabsTrigger>
          <TabsTrigger value="rejected">{m.status.rejected}</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardListIcon className="size-5" />}
          title={m.requests.emptyTitle}
          description={m.requests.emptyBody}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(15_15_15/0.04)] ring-1 ring-black/4">
          <Table>
            <TableHeader>
              <TableRow>
                {showEmployee ? <TableHead>{m.requests.employee}</TableHead> : null}
                <TableHead>{m.requests.type}</TableHead>
                <TableHead>{m.requests.dates}</TableHead>
                <TableHead>{m.requests.days}</TableHead>
                <TableHead>{m.requests.status}</TableHead>
                <TableHead>{m.requests.submitted}</TableHead>
                {canReview ? <TableHead className="text-right">{m.requests.action}</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((request) => (
                <TableRow key={request.id}>
                  {showEmployee ? (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {initials(request.profile.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {request.profile.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {departmentLabel(
                              request.profile.department,
                              m.departments,
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <LeaveTypeBadge type={request.leaveType} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <p>{formatRange(request.startDate, request.endDate)}</p>
                    {request.rejectionReason ? (
                      <p className="max-w-xs text-xs text-destructive">
                        {request.rejectionReason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums">{request.totalDays}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDisplayDate(request.createdAt.slice(0, 10))}
                  </TableCell>
                  {canReview ? (
                    <TableCell className="text-right">
                      {request.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(request)}
                        >
                          {m.dash.review}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
