export const locales = ["en", "hr"] as const;
export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE = "lw_locale";
export const FLASH_COOKIE = "lw_flash";
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "hr";
}

export function localeFromHints(
  cookieValue?: string | null,
  acceptLanguage?: string | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (acceptLanguage?.toLowerCase().includes("hr")) return "hr";
  return DEFAULT_LOCALE;
}

export function formatMessage(
  template: string,
  vars?: Record<string, string | number>,
) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? ""),
  );
}
