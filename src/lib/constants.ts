import type { LeaveStatus, LeaveType, UserRole } from "@/lib/types";

export const APP_NAME = "Leavewise";
export const APP_TAGLINE = "Leave & HR management, clearly run.";

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  manager: "Manager",
  accounting: "Accounting",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual Leave",
  wfh: "Work From Home",
  sick: "Sick Leave",
};

export const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const UNDERSTAFF_THRESHOLD = 3;
