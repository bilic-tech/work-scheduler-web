import type {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  MonthlyBreakdownRow,
  Profile,
} from "@/lib/types";
import { businessDaysInRange, requestCoversDate } from "@/lib/dates";

export function getAnnualBalance(
  profile: Profile,
  requests: LeaveRequest[],
): LeaveBalance {
  const annual = requests.filter(
    (request) =>
      request.userId === profile.id && request.leaveType === "annual",
  );
  const used = annual
    .filter((request) => request.status === "approved")
    .reduce((sum, request) => sum + request.totalDays, 0);
  const pending = annual
    .filter((request) => request.status === "pending")
    .reduce((sum, request) => sum + request.totalDays, 0);

  return {
    allowance: profile.annualLeaveAllowance,
    used,
    pending,
    remaining: Math.max(0, profile.annualLeaveAllowance - used),
    available: Math.max(0, profile.annualLeaveAllowance - used - pending),
  };
}

export function requestsOnDate<T extends LeaveRequest>(
  requests: T[],
  date: Date,
  statuses: LeaveRequest["status"][] = ["approved", "pending"],
): T[] {
  return requests.filter(
    (request) =>
      statuses.includes(request.status) &&
      requestCoversDate(request.startDate, request.endDate, date),
  );
}

export function overlappingTeammates(
  requests: LeaveRequest[],
  userId: string,
  startDate: string,
  endDate: string,
): LeaveRequest[] {
  const days = businessDaysInRange(startDate, endDate);
  return requests.filter((request) => {
    if (request.userId === userId) return false;
    if (request.status === "rejected") return false;
    return days.some((day) =>
      requestCoversDate(request.startDate, request.endDate, day),
    );
  });
}

export function monthlyBreakdown(
  profiles: Profile[],
  requests: LeaveRequest[],
  year: number,
  month: number,
): MonthlyBreakdownRow[] {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  return profiles
    .filter((profile) => profile.role !== "accounting")
    .map((profile) => {
      const approved = requests.filter((request) => {
        if (request.userId !== profile.id || request.status !== "approved") {
          return false;
        }
        return (
          request.startDate.startsWith(monthPrefix) ||
          request.endDate.startsWith(monthPrefix)
        );
      });

      const byType = (type: LeaveType) =>
        approved
          .filter((request) => request.leaveType === type)
          .reduce((sum, request) => {
            const daysInMonth = businessDaysInRange(
              request.startDate,
              request.endDate,
            ).filter((day) => {
              return (
                day.getFullYear() === year && day.getMonth() + 1 === month
              );
            }).length;
            return sum + daysInMonth;
          }, 0);

      const annual = byType("annual");
      const sick = byType("sick");
      const wfh = byType("wfh");

      return {
        userId: profile.id,
        fullName: profile.fullName,
        department: profile.department,
        annual,
        sick,
        wfh,
        total: annual + sick + wfh,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
