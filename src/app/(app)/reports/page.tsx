"use client";

import { ReportsView } from "@/components/reports/reports-view";
import { TableSkeleton } from "@/components/shared/skeletons";
import { useAppData } from "@/lib/data/app-data";

export default function ReportsPage() {
  const { currentUser } = useAppData();
  if (!currentUser) return <TableSkeleton />;
  return <ReportsView />;
}
