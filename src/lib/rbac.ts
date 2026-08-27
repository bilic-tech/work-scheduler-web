import type { LeaveRequest, Profile, UserRole } from "@/lib/types";

export const ROLE_HOME = "/dashboard";

export const ROLE_ROUTES: Record<UserRole, readonly string[]> = {
  employee: ["/dashboard", "/requests"],
  manager: ["/dashboard", "/requests", "/team-calendar", "/team"],
  accounting: ["/dashboard", "/team-calendar", "/reports"],
};

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const routes = ROLE_ROUTES[role] ?? ROLE_ROUTES.employee;
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canCreateRequests(role: UserRole): boolean {
  return role === "employee" || role === "manager";
}

export function canReviewRequests(role: UserRole): boolean {
  return role === "manager";
}

export function canViewTeamCalendar(role: UserRole): boolean {
  return role === "manager" || role === "accounting";
}

export function canViewReports(role: UserRole): boolean {
  return role === "accounting";
}

export function canViewBalances(role: UserRole): boolean {
  return role === "manager";
}

export function canManageEmployees(role: UserRole): boolean {
  return role === "manager";
}

export function visibleRequestsForRole(
  requests: LeaveRequest[],
  user: Profile,
): LeaveRequest[] {
  if (user.role === "employee") {
    return requests.filter((request) => request.userId === user.id);
  }
  if (user.role === "accounting") {
    return requests.filter((request) => request.status === "approved");
  }
  return requests;
}
