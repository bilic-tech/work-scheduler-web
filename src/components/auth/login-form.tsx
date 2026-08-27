"use client";

import { useState } from "react";
import Link from "next/link";

import { loginAction } from "@/actions/auth";
import { PublicNavbar } from "@/components/layout/public-navbar";
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
import { PasswordInput } from "@/components/ui/password-input";
import { useI18n } from "@/i18n/provider";
import { toastError } from "@/lib/toast";
import type { Messages } from "@/i18n/dictionaries";

function toastKey(m: Messages, key: string) {
  return m.toasts[key as keyof Messages["toasts"]] ?? key;
}

export function LoginForm() {
  const { m } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      const message = toastKey(m, result.error);
      setError(message);
      toastError(message);
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md overflow-visible">
      <CardHeader>
        <CardTitle>{m.auth.signInTitle}</CardTitle>
        <CardDescription>{m.auth.signInBody}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{m.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{m.auth.password}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? m.auth.signingIn : m.auth.signIn}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-semibold text-primary">
            {m.auth.forgotPassword}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {m.auth.needAccount}{" "}
          <Link href="/signup" className="font-semibold text-primary">
            {m.nav.register}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,oklch(0.92_0.06_250)_0%,transparent_55%),linear-gradient(180deg,oklch(0.95_0.04_250)_0%,white_58%)]">
      <PublicNavbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
