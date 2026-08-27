"use client";

import { useEffect } from "react";

import { FLASH_COOKIE } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";

export function FlashToasts() {
  const { m } = useI18n();

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]+)`),
    );
    if (!match) return;
    const raw = decodeURIComponent(match[1]);
    document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0; samesite=lax`;
    const [kind, key] = raw.split(":");
    const message =
      m.toasts[key as keyof typeof m.toasts] ?? key;
    if (kind === "success") toastSuccess(message);
    else if (kind === "warning") toastWarning(message);
    else toastError(message);
  }, [m]);

  return null;
}
