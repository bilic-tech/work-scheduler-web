"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { countBusinessDays } from "@/lib/dates";
import { mapProfile, mapRequest } from "@/lib/db/mappers";
import { query } from "@/lib/db/pool";
import { getAnnualBalance } from "@/lib/leave";
import { notifyUsers } from "@/lib/notifications/notify";
import { canCreateRequests, canReviewRequests } from "@/lib/rbac";
import type { DbLeaveRequest, DbProfile } from "@/lib/types";

const createSchema = z.object({
  leaveType: z.enum(["annual", "wfh", "sick"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(8),
  totalDays: z.number().int().positive(),
  managerId: z.string().uuid(),
});

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

export async function createLeaveRequestAction(input: unknown) {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Check the request details and try again.");
  }
  const payload = parsed.data;
  const user = await requireUser();
  if (!canCreateRequests(user.role)) {
    throw new Error("Your role cannot submit leave requests.");
  }

  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  if (countBusinessDays(start, end) !== payload.totalDays) {
    throw new Error("Business-day total does not match the selected range.");
  }

  if (payload.leaveType === "annual") {
    const requestRows = await query<DbLeaveRequest>(
      "select * from leave_requests where user_id = $1",
      [user.id],
    );
    const balance = getAnnualBalance(user, requestRows.rows.map(mapRequest));
    if (payload.totalDays > balance.available) {
      throw new Error(
        `Only ${balance.available} annual leave day${balance.available === 1 ? "" : "s"} remaining.`,
      );
    }
  }

  const managerResult = await query<DbProfile>(
    "select * from profiles where id = $1 and role = 'manager' limit 1",
    [payload.managerId],
  );
  const manager = managerResult.rows[0];
  if (!manager) {
    throw new Error("Select a manager to review this request.");
  }

  await query(
    `insert into leave_requests
      (user_id, leave_type, start_date, end_date, total_days, reason, status, assigned_manager_id)
     values ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
    [
      user.id,
      payload.leaveType,
      payload.startDate,
      payload.endDate,
      payload.totalDays,
      payload.reason,
      manager.id,
    ],
  );

  await notifyUsers({
    userIds: [manager.id],
    title: "New leave request",
    body: `${user.fullName} requested ${payload.totalDays} day${payload.totalDays === 1 ? "" : "s"} of ${payload.leaveType} leave.`,
    type: "leave_submitted",
    href: "/requests",
    emails: [
      {
        to: manager.email,
        subject: "New leave request to review",
        text: `${user.fullName} submitted a ${payload.leaveType} request from ${payload.startDate} to ${payload.endDate} (${payload.totalDays} business days).\n\nReview it at the Approvals page.`,
      },
    ],
  });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
}

export async function reviewLeaveRequestAction(input: unknown) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Check the review details and try again.");
  }
  const payload = parsed.data;
  const user = await requireUser();
  if (!canReviewRequests(user.role)) {
    throw new Error("Only managers can review requests.");
  }

  const requestResult = await query<DbLeaveRequest>(
    "select * from leave_requests where id = $1 limit 1",
    [payload.requestId],
  );
  const request = requestResult.rows[0];
  if (!request) throw new Error("Request not found.");

  await query(
    `update leave_requests
     set status = $1,
         reviewed_by = $2,
         rejection_reason = $3
     where id = $4`,
    [
      payload.status,
      user.id,
      payload.status === "rejected" ? payload.rejectionReason ?? null : null,
      payload.requestId,
    ],
  );

  const ownerResult = await query<DbProfile>(
    "select * from profiles where id = $1 limit 1",
    [request.user_id],
  );
  const owner = ownerResult.rows[0];
  if (owner) {
    const person = mapProfile(owner);
    await notifyUsers({
      userIds: [person.id],
      title:
        payload.status === "approved" ? "Leave approved" : "Leave rejected",
      body:
        payload.status === "approved"
          ? `${user.fullName} approved your ${request.leave_type} request.`
          : `${user.fullName} rejected your ${request.leave_type} request.`,
      type: "leave_reviewed",
      href: "/requests",
      emails: [
        {
          to: person.email,
          subject:
            payload.status === "approved"
              ? "Your leave request was approved"
              : "Your leave request was rejected",
          text:
            payload.status === "approved"
              ? `Hi ${person.fullName},\n\nYour ${request.leave_type} request from ${request.start_date} to ${request.end_date} was approved.`
              : `Hi ${person.fullName},\n\nYour ${request.leave_type} request from ${request.start_date} to ${request.end_date} was rejected.${payload.rejectionReason ? `\n\nReason: ${payload.rejectionReason}` : ""}`,
        },
      ],
    });
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/team-calendar");
  revalidatePath("/reports");
}
