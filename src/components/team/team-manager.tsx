"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlusIcon } from "@/components/icons";

import { addEmployeeAction, removeEmployeeAction } from "@/actions/employees";
import { DepartmentSelect } from "@/components/shared/department-select";
import { PersonRow } from "@/components/shared/metric-card";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/data/app-data";
import { DEFAULT_DEPARTMENT, departmentLabel } from "@/lib/departments";
import { initials } from "@/lib/leave";
import { useI18n } from "@/i18n/provider";
import { toastError, toastSuccess } from "@/lib/toast";
import type { UserRole } from "@/lib/types";

export function TeamManager() {
  const { currentUser, profiles } = useAppData();
  const { m, t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("employee");
  const [department, setDepartment] = useState<string>(DEFAULT_DEPARTMENT);
  const [pending, setPending] = useState(false);

  const people = profiles
    .slice()
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  async function onAdd(formData: FormData) {
    setPending(true);
    try {
      await addEmployeeAction({
        email: formData.get("email"),
        password: formData.get("password"),
        fullName: formData.get("fullName"),
        role,
        department,
        annualLeaveAllowance: formData.get("annualLeaveAllowance"),
      });
      await queryClient.invalidateQueries({ queryKey: ["app-bootstrap"] });
      toastSuccess(m.toasts.personAdded);
      setOpen(false);
      setRole("employee");
      setDepartment(DEFAULT_DEPARTMENT);
    } catch (error) {
      toastError(error instanceof Error ? error.message : m.toasts.couldNotAdd);
    } finally {
      setPending(false);
    }
  }

  async function onRemove(userId: string, name: string) {
    if (!window.confirm(t(m.team.confirmRemove, { name }))) {
      return;
    }
    try {
      await removeEmployeeAction(userId);
      await queryClient.invalidateQueries({ queryKey: ["app-bootstrap"] });
      toastSuccess(t(m.toasts.personRemoved, { name }));
    } catch (error) {
      toastError(error instanceof Error ? error.message : m.toasts.couldNotRemove);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={m.team.title}
        description={m.team.body}
        action={
          <Button onClick={() => setOpen(true)}>
            <UserPlusIcon />
            {m.team.addPerson}
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{m.team.people}</CardTitle>
          <CardDescription>{m.team.peopleBody}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {people.length === 0 ? (
            <EmptyState
              title={m.team.emptyTitle}
              description={m.team.emptyBody}
            />
          ) : (
            people.map((profile, index) => (
              <PersonRow
                key={profile.id}
                rank={index + 1}
                initials={initials(profile.fullName)}
                name={profile.fullName}
                meta={`${profile.email} · ${departmentLabel(profile.department, m.departments)} · ${t(m.team.daysMeta, { days: profile.annualLeaveAllowance })}`}
                trailing={<RoleBadge role={profile.role} />}
                action={
                  profile.id === currentUser?.id ? null : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemove(profile.id, profile.fullName)}
                    >
                      {m.team.remove}
                    </Button>
                  )
                }
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{m.team.addTitle}</DialogTitle>
            <DialogDescription>{m.team.addBody}</DialogDescription>
          </DialogHeader>
          <form action={onAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{m.auth.fullName}</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{m.auth.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-person-password">{m.team.tempPassword}</Label>
              <PasswordInput
                id="add-person-password"
                name="password"
                autoComplete="off"
                minLength={8}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">{m.auth.department}</Label>
                <DepartmentSelect
                  id="department"
                  name="department"
                  value={department}
                  onValueChange={setDepartment}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualLeaveAllowance">{m.team.annualDays}</Label>
                <Input
                  id="annualLeaveAllowance"
                  name="annualLeaveAllowance"
                  type="number"
                  min={0}
                  defaultValue={20}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{m.team.role}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? m.roles[value as UserRole] : m.team.selectRole
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">{m.roles.employee}</SelectItem>
                  <SelectItem value="manager">{m.roles.manager}</SelectItem>
                  <SelectItem value="accounting">{m.roles.accounting}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? m.team.adding : m.team.addPerson}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
