"use client";

import { TableSkeleton } from "@/components/shared/skeletons";
import { TeamManager } from "@/components/team/team-manager";
import { useAppData } from "@/lib/data/app-data";

export default function TeamPage() {
  const { currentUser } = useAppData();
  if (!currentUser) return <TableSkeleton />;
  return <TeamManager />;
}
