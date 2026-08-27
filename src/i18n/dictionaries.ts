import { en } from "./en";
import { hr } from "./hr";
import type { Locale } from "./config";

export const dictionaries = { en, hr } as const;
export type Messages = typeof en;

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
