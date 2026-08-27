import { cookies } from "next/headers";

import { FLASH_COOKIE } from "@/i18n/config";

export type FlashKind = "success" | "error" | "warning";

export async function setFlash(kind: FlashKind, key: string) {
  const store = await cookies();
  store.set(FLASH_COOKIE, `${kind}:${key}`, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 20,
  });
}
