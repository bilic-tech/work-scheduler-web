"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/provider";
import {
  DEFAULT_DEPARTMENT,
  DEPARTMENTS,
  isKnownDepartment,
  normalizeDepartment,
} from "@/lib/departments";

function unknownOption(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isKnownDepartment(normalizeDepartment(trimmed))) return null;
  return trimmed;
}

export function DepartmentSelect({
  id,
  name = "department",
  value,
  defaultValue = DEFAULT_DEPARTMENT,
  onValueChange,
  extraValue,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  extraValue?: string | null;
}) {
  const { m } = useI18n();
  const extra =
    unknownOption(extraValue) ??
    unknownOption(value) ??
    unknownOption(defaultValue);

  const resolvedDefault = normalizeDepartment(defaultValue) || DEFAULT_DEPARTMENT;
  const resolvedValue =
    value === undefined ? undefined : normalizeDepartment(value) || value;

  function labelFor(selected: string | null) {
    if (!selected) return m.auth.selectDepartment;
    const normalized = normalizeDepartment(selected);
    if (isKnownDepartment(normalized)) return m.departments[normalized];
    return selected;
  }

  return (
    <Select
      name={name}
      required
      value={resolvedValue}
      defaultValue={resolvedValue === undefined ? resolvedDefault : undefined}
      onValueChange={(next) => {
        if (next) onValueChange?.(next);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(selected: string | null) => labelFor(selected)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {DEPARTMENTS.map((department) => (
          <SelectItem key={department} value={department}>
            {m.departments[department]}
          </SelectItem>
        ))}
        {extra ? <SelectItem value={extra}>{extra}</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
