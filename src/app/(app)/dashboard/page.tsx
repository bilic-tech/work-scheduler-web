"use client";

import {
  AccountingDashboard,
  EmployeeDashboard,
  ManagerDashboard,
} from "@/components/dashboard/role-dashboards";
import { StatsSkeleton } from "@/components/shared/skeletons";
import { useAppData } from "@/lib/data/app-data";

export default function DashboardPage() {
  const { currentUser } = useAppData();

  if (!currentUser) return <StatsSkeleton />;
  if (currentUser.role === "manager") return <ManagerDashboard />;
  if (currentUser.role === "accounting") return <AccountingDashboard />;
  return <EmployeeDashboard />;
}
