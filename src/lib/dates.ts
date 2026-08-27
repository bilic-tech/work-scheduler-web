import {
  eachDayOfInterval,
  format,
  isWeekend,
  parseISO,
  startOfDay,
} from "date-fns";

export function toISODate(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export function parseISODate(value: string): Date {
  return startOfDay(parseISO(value));
}

export function formatDisplayDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISODate(value) : value;
  return format(date, "MMM d, yyyy");
}

export function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISODate(value) : value;
  return format(date, "MMM d");
}

export function formatRange(start: string, end: string): string {
  if (start === end) return formatDisplayDate(start);
  return `${formatShortDate(start)} – ${formatDisplayDate(end)}`;
}

export function countBusinessDays(start: Date, end: Date): number {
  if (end < start) return 0;
  return eachDayOfInterval({ start, end }).filter((day) => !isWeekend(day))
    .length;
}

export function businessDaysInRange(start: string, end: string): Date[] {
  return eachDayOfInterval({
    start: parseISODate(start),
    end: parseISODate(end),
  }).filter((day) => !isWeekend(day));
}

export function requestCoversDate(
  startDate: string,
  endDate: string,
  date: Date,
): boolean {
  const iso = toISODate(date);
  return iso >= startDate && iso <= endDate && !isWeekend(date);
}
