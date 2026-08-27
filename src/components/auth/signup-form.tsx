"use client";

import { useState } from "react";
import Link from "next/link";

import { registerAction } from "@/actions/auth";
import { AuthShell } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DepartmentSelect } from "@/components/shared/department-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useI18n } from "@/i18n/provider";
import { DEFAULT_DEPARTMENT } from "@/lib/departments";
import { toastError } from "@/lib/toast";
import type { Messages } from "@/i18n/dictionaries";

function toastKey(m: Messages, key: string) {
  return m.toasts[key as keyof Messages["toasts"]] ?? key;
}

export function SignupForm() {
  const { m } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [department, setDepartment] = useState<string>(DEFAULT_DEPARTMENT);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("department", department);
    const result = await registerAction(formData);
    if (result?.error) {
      const message = toastKey(m, result.error);
      setError(message);
      toastError(message);
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md overflow-visible">
        <CardHeader>
          <CardTitle>{m.auth.createTitle}</CardTitle>
          <CardDescription>{m.auth.createBody}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          <form action={onSubmit} className="space-y-4 overflow-visible">
            <div className="space-y-2">
              <Label htmlFor="fullName">{m.auth.fullName}</Label>
              <Input id="fullName" name="fullName" required />
            </div>
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
              <Label htmlFor="email">{m.auth.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2 overflow-visible">
              <Label htmlFor="signup-password">{m.auth.password}</Label>
              <PasswordInput
                id="signup-password"
                name="password"
                autoComplete="off"
                minLength={8}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? m.auth.creating : m.nav.register}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {m.auth.alreadyAccount}{" "}
            <Link href="/login" className="font-semibold text-primary">
              {m.auth.signIn}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
