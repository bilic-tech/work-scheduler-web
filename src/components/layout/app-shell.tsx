"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useAppData } from "@/lib/data/app-data";

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser } = useAppData();

  return (
    <div className="flex min-h-svh bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,oklch(0.93_0.05_250)_0%,transparent_55%),linear-gradient(180deg,oklch(0.96_0.03_250)_0%,white_52%)]">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r bg-white md:block">
        <AppSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {currentUser ? (
            children
          ) : (
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
              <div className="h-24 animate-pulse rounded-3xl bg-muted" />
              <div className="h-64 animate-pulse rounded-3xl bg-muted" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
