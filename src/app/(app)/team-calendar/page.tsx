"use client";

import { MonthCalendar } from "@/components/calendar/month-calendar";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarSkeleton } from "@/components/shared/skeletons";
import { useAppData } from "@/lib/data/app-data";
import { useI18n } from "@/i18n/provider";

export default function TeamCalendarPage() {
  const { currentUser, visibleRequests } = useAppData();
  const { m } = useI18n();

  if (!currentUser) return <CalendarSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentUser.role === "accounting" ? m.calendar.absenceTitle : m.calendar.teamTitle}
        description={
          currentUser.role === "accounting"
            ? m.calendar.absenceBody
            : m.calendar.teamBody
        }
      />
      <MonthCalendar
        requests={
          currentUser.role === "accounting"
            ? visibleRequests.filter((request) => request.status === "approved")
            : visibleRequests
        }
        readOnly={currentUser.role === "accounting"}
      />
    </div>
  );
}
