import type { LeaveType } from "@/lib/types";

export const APP_NAME = "Leavewise";
export const APP_TAGLINE = "Leave & HR management, clearly run.";

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual Leave",
  wfh: "Work From Home",
  sick: "Sick Leave",
};

export const UNDERSTAFF_THRESHOLD = 3;
