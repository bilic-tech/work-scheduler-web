import { normalizeDepartment } from "@/lib/departments";
import {
  normalizeRole,
  type AppNotification,
  type DbLeaveRequest,
  type DbNotification,
  type DbProfile,
  type LeaveRequest,
  type Profile,
} from "@/lib/types";

function asIso(value: string | Date | null | undefined) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function mapProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: normalizeRole(row.role),
    department: normalizeDepartment(row.department),
    annualLeaveAllowance: row.annual_leave_allowance,
    avatarUrl: row.avatar_url,
    createdAt: asIso(row.created_at),
  };
}

export function mapRequest(row: DbLeaveRequest): LeaveRequest {
  return {
    id: row.id,
    userId: row.user_id,
    leaveType: row.leave_type,
    startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10),
    totalDays: row.total_days,
    reason: row.reason,
    status: row.status,
    assignedManagerId: row.assigned_manager_id ?? null,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    createdAt: asIso(row.created_at),
  };
}

export function mapNotification(row: DbNotification): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    href: row.href,
    readAt: row.read_at ? asIso(row.read_at) : null,
    createdAt: asIso(row.created_at),
  };
}
