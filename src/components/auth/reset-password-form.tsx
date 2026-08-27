"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { resetPasswordAction } from "@/actions/auth";
import { AuthShell } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useI18n } from "@/i18n/provider";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Messages } from "@/i18n/dictionaries";

function toastKey(m: Messages, key: string) {
  return m.toasts[key as keyof Messages["toasts"]] ?? key;
}

export function ResetPasswordForm() {
  const { m } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("token", token);
    const result = await resetPasswordAction(formData);
    setPending(false);
    if (result?.error) {
      const message = toastKey(m, result.error);
      setError(message);
      toastError(message);
      return;
    }
    toastSuccess(m.toasts.passwordChanged);
    setDone(true);
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md overflow-visible">
        <CardHeader>
          <CardTitle>{m.auth.choosePassword}</CardTitle>
          <CardDescription>{m.auth.choosePasswordBody}</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-destructive">{m.auth.missingToken}</p>
          ) : done ? (
            <p className="text-sm text-muted-foreground">
              {m.auth.passwordUpdated}{" "}
              <Link href="/login" className="font-semibold text-primary">
                {m.auth.signIn}
              </Link>
            </p>
          ) : (
            <form action={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password">{m.auth.newPassword}</Label>
                <PasswordInput
                  id="reset-password"
                  name="password"
                  autoComplete="off"
                  minLength={8}
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? m.auth.saving : m.auth.updatePassword}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
