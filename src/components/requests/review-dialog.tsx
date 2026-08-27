"use client";

import { useState } from "react";

import { LeaveTypeBadge, StatusBadge } from "@/components/shared/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRange } from "@/lib/dates";
import { useAppData } from "@/lib/data/app-data";
import { departmentLabel } from "@/lib/departments";
import { initials } from "@/lib/leave";
import { useI18n } from "@/i18n/provider";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import type { LeaveRequestWithProfile } from "@/lib/types";

export function ReviewDialog({
  request,
  open,
  onOpenChange,
}: {
  request: LeaveRequestWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { reviewRequest } = useAppData();
  const { m, t } = useI18n();
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);

  function close() {
    onOpenChange(false);
    setReason("");
    setMode(null);
  }

  async function approve() {
    if (!request) return;
    try {
      await reviewRequest({ requestId: request.id, status: "approved" });
      toastSuccess(m.toasts.requestApproved);
      close();
    } catch (error) {
      toastError(error instanceof Error ? error.message : m.toasts.couldNotApprove);
    }
  }

  async function reject() {
    if (!request) return;
    if (!reason.trim()) {
      toastWarning(m.review.needReason);
      return;
    }
    try {
      await reviewRequest({
        requestId: request.id,
        status: "rejected",
        rejectionReason: reason.trim(),
      });
      toastSuccess(m.toasts.requestRejected);
      close();
    } catch (error) {
      toastError(error instanceof Error ? error.message : m.toasts.couldNotReject);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.review.title}</DialogTitle>
          <DialogDescription>{m.review.body}</DialogDescription>
        </DialogHeader>
        {request ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {initials(request.profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{request.profile.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {departmentLabel(request.profile.department, m.departments)} ·{" "}
                  {request.profile.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <LeaveTypeBadge type={request.leaveType} />
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm">
              {formatRange(request.startDate, request.endDate)} ·{" "}
              {t(
                request.totalDays === 1
                  ? m.dash.businessDays
                  : m.dash.businessDaysPlural,
                { count: request.totalDays },
              )}
            </p>
            <p className="rounded-lg bg-muted/70 p-3 text-sm">{request.reason}</p>
            {mode === "reject" ? (
              <div className="space-y-2">
                <Label htmlFor="rejection">{m.review.rejectionReason}</Label>
                <Textarea
                  id="rejection"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={m.review.rejectionPlaceholder}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          {mode === "reject" ? (
            <>
              <Button variant="outline" onClick={() => setMode(null)}>
                {m.review.back}
              </Button>
              <Button variant="destructive" onClick={reject}>
                {m.review.confirmReject}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode("reject")}>
                {m.review.reject}
              </Button>
              <Button onClick={approve}>{m.review.approve}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
