"use client";

import { useState } from "react";
import Link from "next/link";

import { requestPasswordResetAction } from "@/actions/auth";
import { AuthShell } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/provider";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Messages } from "@/i18n/dictionaries";

function toastKey(m: Messages, key: string) {
  return m.toasts[key as keyof Messages["toasts"]] ?? key;
}

export function ForgotPasswordForm() {
  const { m, t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await requestPasswordResetAction(formData);
    setPending(false);
    if (result?.error) {
      const message = toastKey(m, result.error);
      setError(message);
      toastError(message);
      return;
    }
    toastSuccess(m.toasts.resetSent);
    setSent(true);
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{m.auth.resetTitle}</CardTitle>
          <CardDescription>{m.auth.resetBody}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              {t(m.auth.resetSent, { host: "localhost:8025" })}{" "}
              <a
                href="http://localhost:8025"
                className="font-semibold text-primary"
                target="_blank"
                rel="noreferrer"
              >
                localhost:8025
              </a>
            </p>
          ) : (
            <form action={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{m.auth.email}</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? m.auth.sending : m.auth.sendLink}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary">
              {m.auth.backToSignIn}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
