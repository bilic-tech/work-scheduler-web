"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { LogInIcon, UserPlusIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function PublicNavbar() {
  const pathname = usePathname();
  const { m } = useI18n();
  const onLogin = pathname === "/login";
  const onSignup = pathname === "/signup";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/login" aria-label={m.nav.home}>
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <nav className="flex items-center gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              variant={onLogin ? "default" : "outline"}
              aria-current={onLogin ? "page" : undefined}
            >
              <LogInIcon />
              {m.nav.login}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/signup" />}
              variant={onSignup ? "default" : "outline"}
              aria-current={onSignup ? "page" : undefined}
            >
              <UserPlusIcon />
              {m.nav.register}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
