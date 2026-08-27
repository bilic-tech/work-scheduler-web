"use client";

import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLocale, m } = useI18n();

  return (
    <div
      className="flex items-center rounded-full border border-border bg-white p-0.5"
      aria-label={m.nav.language}
    >
      <Button
        type="button"
        size="xs"
        variant={locale === "en" ? "default" : "ghost"}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        size="xs"
        variant={locale === "hr" ? "default" : "ghost"}
        aria-pressed={locale === "hr"}
        onClick={() => setLocale("hr")}
      >
        HR
      </Button>
    </div>
  );
}
