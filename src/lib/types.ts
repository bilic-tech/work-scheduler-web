export const USER_ROLES = ["employee", "manager", "accounting"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

export function normalizeRole(value: unknown): UserRole {
  if (isUserRole(value)) return value;
  const key = String(value ?? "")
    .trim()
    .toLowerCase();
  if (key === "manager" || key === "menadžer" || key === "menadzer") {
    return "manager";
  }
  if (
    key === "accounting" ||
    key === "računovodstvo" ||
    key === "racunovodstvo"
  ) {
    return "accounting";
  }
  return "employee";
}

export const LEAVE_TYPES = ["annual", "wfh", "sick"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ["pending", "approved", "rejected"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  annualLeaveAllowance: number;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  assignedManagerId?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface LeaveRequestWithProfile extends LeaveRequest {
  profile: Profile;
  assignedManager?: Profile | null;
  reviewer?: Profile | null;
}

export interface LeaveBalance {
  allowance: number;
  used: number;
  pending: number;
  remaining: number;
  available: number;
}

export interface MonthlyBreakdownRow {
  userId: string;
  fullName: string;
  department: string;
  annual: number;
  sick: number;
  wfh: number;
  total: number;
}

export interface DbProfile {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  department: string;
  annual_leave_allowance: number;
  avatar_url: string | null;
  created_at: string | Date;
}

export interface DbLeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  assigned_manager_id?: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string | Date;
}

export interface CreateRequestInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  managerId: string;
}

export interface ReviewRequestInput {
  requestId: string;
  status: Extract<LeaveStatus, "approved" | "rejected">;
  rejectionReason?: string;
}

export interface AddEmployeeInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department: string;
  annualLeaveAllowance: number;
}

export const NOTIFICATION_TYPES = [
  "welcome",
  "leave_submitted",
  "leave_reviewed",
  "employee_added",
  "employee_removed",
  "password_reset",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  href: string | null;
  read_at: string | Date | null;
  created_at: string | Date;
}
