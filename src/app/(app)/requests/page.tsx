"use client";

import { useState } from "react";

import { RequestForm } from "@/components/requests/request-form";
import { RequestTable } from "@/components/requests/request-table";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppData } from "@/lib/data/app-data";
import { canCreateRequests } from "@/lib/rbac";
import { useI18n } from "@/i18n/provider";

export default function RequestsPage() {
  const { currentUser, visibleRequests } = useAppData();
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  if (!currentUser) return <TableSkeleton />;
  const canCreate = canCreateRequests(currentUser.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentUser.role === "manager" ? m.requests.managerTitle : m.requests.myTitle}
        description={
          currentUser.role === "manager"
            ? m.requests.managerBody
            : m.requests.myBody
        }
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>{m.dash.newRequest}</Button>
          ) : undefined
        }
      />
      <RequestTable
        requests={visibleRequests}
        showEmployee={currentUser.role !== "employee"}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{m.requests.newTitle}</DialogTitle>
            <DialogDescription>{m.requests.newBody}</DialogDescription>
          </DialogHeader>
          <RequestForm onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
