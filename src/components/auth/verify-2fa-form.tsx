"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  cancelTwoFactorAction,
  resendTwoFactorAction,
  verifyTwoFactorAction,
} from "@/actions/auth";
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
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import type { Messages } from "@/i18n/dictionaries";

function toastKey(m: Messages, key: string) {
  return m.toasts[key as keyof Messages["toasts"]] ?? key;
}

export function Verify2faForm({
  emailHint,
  resendIn,
}: {
  emailHint: string;
  resendIn: number;
}) {
  const { m, t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(resendIn);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await verifyTwoFactorAction(formData);
    if (result?.error) {
      const message = toastKey(m, result.error);
      setError(message);
      toastError(message);
      setPending(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const result = await resendTwoFactorAction();
    setResending(false);
    if (result?.error) {
      const message = toastKey(m, result.error);
      if (result.error === "otpResendWait") {
        toastWarning(message);
        if (result.resendIn) setCooldown(result.resendIn);
      } else {
        toastError(message);
      }
      return;
    }
    toastSuccess(m.toasts.otpResent);
    setCooldown(result.resendIn ?? 45);
  }

  return (
    <Card className="w-full max-w-md overflow-visible">
      <CardHeader>
        <CardTitle>{m.auth.verifyTitle}</CardTitle>
        <CardDescription>
          {t(m.auth.verifyBody, { email: emailHint })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{m.auth.verifyCode}</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? m.auth.verifying : m.auth.verifySubmit}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t(m.auth.mailhogHint, { host: "localhost:8025" })}{" "}
          <a
            href="http://localhost:8025"
            className="font-semibold text-primary"
            target="_blank"
            rel="noreferrer"
          >
            localhost:8025
          </a>
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={cooldown > 0 || resending}
            onClick={() => void onResend()}
          >
            {cooldown > 0
              ? t(m.auth.resendIn, { seconds: cooldown })
              : m.auth.resendCode}
          </Button>
          <form action={cancelTwoFactorAction}>
            <button
              type="submit"
              className="text-sm font-semibold text-primary"
            >
              {m.auth.useDifferentAccount}
            </button>
          </form>
          <Link href="/login" className="text-sm text-muted-foreground">
            {m.auth.backToSignIn}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
