export const DEPARTMENTS = [
  "marketing",
  "it",
  "accounting",
  "networks",
  "people",
  "general",
  "sales",
  "legal",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEFAULT_DEPARTMENT: Department = "general";

export const DEPARTMENT_EN_LABELS: Record<Department, string> = {
  marketing: "Marketing",
  it: "IT",
  accounting: "Accounting",
  networks: "Networks",
  people: "People / HR",
  general: "General / Operations",
  sales: "Sales",
  legal: "Legal",
};

const LEGACY_ALIASES: Record<string, Department> = {
  marketing: "marketing",
  it: "it",
  accounting: "accounting",
  "računovodstvo": "accounting",
  racunovodstvo: "accounting",
  networks: "networks",
  "mreže": "networks",
  mreze: "networks",
  people: "people",
  hr: "people",
  "people / hr": "people",
  "ljudi / hr": "people",
  "kadrovska / hr": "people",
  "human resources": "people",
  general: "general",
  operations: "general",
  "general / operations": "general",
  "opće / operacije": "general",
  "opce / operacije": "general",
  sales: "sales",
  prodaja: "sales",
  legal: "legal",
  pravni: "legal",
  "pravna služba": "legal",
  "pravna sluzba": "legal",
};

export function isKnownDepartment(value: string): value is Department {
  return (DEPARTMENTS as readonly string[]).includes(value);
}

export function normalizeDepartment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const key = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (isKnownDepartment(key)) return key;
  return LEGACY_ALIASES[key] ?? trimmed;
}

export function departmentLabel(
  value: string,
  labels: Record<Department, string>,
): string {
  const normalized = normalizeDepartment(value);
  if (isKnownDepartment(normalized)) {
    return labels[normalized];
  }
  return trimmedOrOriginal(value);
}

function trimmedOrOriginal(value: string): string {
  return value.trim() || value;
}

export function departmentExportLabel(value: string): string {
  return departmentLabel(value, DEPARTMENT_EN_LABELS);
}
