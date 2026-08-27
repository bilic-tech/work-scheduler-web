import { format } from "date-fns";

import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { departmentExportLabel } from "@/lib/departments";
import { formatDisplayDate } from "@/lib/dates";
import type { LeaveRequestWithProfile, MonthlyBreakdownRow } from "@/lib/types";

function csvEscape(value: string | number): string {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportMonthlyCsv(
  year: number,
  month: number,
  rows: MonthlyBreakdownRow[],
): void {
  const header = [
    "Employee",
    "Department",
    "Annual Leave",
    "Sick Leave",
    "Work From Home",
    "Total Days",
  ];
  const body = rows.map((row) => [
    row.fullName,
    departmentExportLabel(row.department),
    row.annual,
    row.sick,
    row.wfh,
    row.total,
  ]);
  const totals = rows.reduce(
    (acc, row) => ({
      annual: acc.annual + row.annual,
      sick: acc.sick + row.sick,
      wfh: acc.wfh + row.wfh,
      total: acc.total + row.total,
    }),
    { annual: 0, sick: 0, wfh: 0, total: 0 },
  );
  downloadCsv(`leavewise-${year}-${String(month).padStart(2, "0")}.csv`, [
    header,
    ...body.map((row) => row.map(String)),
    ["TOTAL", "", String(totals.annual), String(totals.sick), String(totals.wfh), String(totals.total)],
  ]);
}

export function exportApprovedCsv(
  year: number,
  month: number,
  requests: LeaveRequestWithProfile[],
): void {
  downloadCsv(
    `leavewise-approved-${year}-${String(month).padStart(2, "0")}.csv`,
    [
      ["Employee", "Department", "Type", "Start", "End", "Days", "Reason"],
      ...requests.map((request) => [
        request.profile.fullName,
        departmentExportLabel(request.profile.department),
        LEAVE_TYPE_LABELS[request.leaveType],
        formatDisplayDate(request.startDate),
        formatDisplayDate(request.endDate),
        String(request.totalDays),
        request.reason,
      ]),
    ],
  );
}

export function printMonthlyReport(
  year: number,
  month: number,
  rows: MonthlyBreakdownRow[],
): void {
  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");
  const totals = rows.reduce(
    (acc, row) => ({
      annual: acc.annual + row.annual,
      sick: acc.sick + row.sick,
      wfh: acc.wfh + row.wfh,
      total: acc.total + row.total,
    }),
    { annual: 0, sick: 0, wfh: 0, total: 0 },
  );

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.fullName}</td>
          <td>${departmentExportLabel(row.department)}</td>
          <td>${row.annual}</td>
          <td>${row.sick}</td>
          <td>${row.wfh}</td>
          <td>${row.total}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
  <html>
    <head>
      <title>Leavewise payroll report — ${monthLabel}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; color: #14221f; padding: 32px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        p { color: #5b6b66; margin: 0 0 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #d7e0dc; }
        th { font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: #5b6b66; }
        tfoot td { font-weight: 600; }
      </style>
    </head>
    <body>
      <h1>Leavewise payroll report</h1>
      <p>${monthLabel} · approved absences only</p>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Annual</th>
            <th>Sick</th>
            <th>WFH</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td></td>
            <td>${totals.annual}</td>
            <td>${totals.sick}</td>
            <td>${totals.wfh}</td>
            <td>${totals.total}</td>
          </tr>
        </tfoot>
      </table>
    </body>
  </html>`;

  const frame = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!frame) return;
  frame.document.write(html);
  frame.document.close();
  frame.focus();
  frame.print();
}
