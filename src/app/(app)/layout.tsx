import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getBootstrapAction } from "@/actions/auth";
import { AppShell } from "@/components/layout/app-shell";
import { CalendarSkeleton } from "@/components/shared/skeletons";
import { AppDataProvider } from "@/lib/data/app-data";
import { canAccessPath } from "@/lib/rbac";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootstrap = await getBootstrapAction();
  if (!bootstrap.currentUser) {
    redirect("/login");
  }
  const pathname =
    (await headers()).get("x-leavewise-pathname") ?? "/dashboard";
  if (!canAccessPath(bootstrap.currentUser.role, pathname)) {
    redirect("/dashboard");
  }

  return (
    <AppDataProvider initialData={bootstrap}>
      <AppShell>{children ?? <CalendarSkeleton />}</AppShell>
    </AppDataProvider>
  );
}
