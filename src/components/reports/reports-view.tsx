"use client";

import { DownloadIcon, FileTextIcon } from "@/components/icons";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppData } from "@/lib/data/app-data";
import { exportApprovedCsv, exportMonthlyCsv, printMonthlyReport } from "@/lib/export";
import { monthlyBreakdown } from "@/lib/leave";
import { formatRange } from "@/lib/dates";
import { LeaveTypeBadge } from "@/components/shared/status-badges";
import { departmentLabel } from "@/lib/departments";
import { useI18n } from "@/i18n/provider";
import { toastSuccess } from "@/lib/toast";

export function ReportsView() {
  const { profiles, requests, visibleRequests } = useAppData();
  const { m } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const rows = useMemo(
    () => monthlyBreakdown(profiles, requests, year, month),
    [profiles, requests, year, month],
  );
  const totals = rows.reduce(
    (acc, row) => ({
      annual: acc.annual + row.annual,
      sick: acc.sick + row.sick,
      wfh: acc.wfh + row.wfh,
      total: acc.total + row.total,
    }),
    { annual: 0, sick: 0, wfh: 0, total: 0 },
  );

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthRequests = visibleRequests.filter(
    (request) =>
      request.startDate.startsWith(monthPrefix) ||
      request.endDate.startsWith(monthPrefix),
  );

  const years = [2025, 2026, 2027];

  return (
    <div className="space-y-6">
      <PageHeader
        title={m.reports.title}
        description={m.reports.body}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportMonthlyCsv(year, month, rows);
                toastSuccess(m.toasts.csvDownloaded);
              }}
            >
              <DownloadIcon />
              {m.reports.exportCsv}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportApprovedCsv(year, month, monthRequests);
                toastSuccess(m.toasts.detailedCsvDownloaded);
              }}
            >
              <DownloadIcon />
              {m.reports.requestCsv}
            </Button>
            <Button
              onClick={() => {
                printMonthlyReport(year, month, rows);
                toastSuccess(m.toasts.printOpened);
              }}
            >
              <FileTextIcon />
              {m.reports.exportPdf}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(value: string | null) =>
                value ? m.months[Number(value) - 1] : m.reports.month
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {m.months.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {m.months[month - 1]} {year}
          </CardTitle>
          <CardDescription>{m.reports.monthHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.reports.employee}</TableHead>
                <TableHead>{m.reports.department}</TableHead>
                <TableHead>{m.reports.annual}</TableHead>
                <TableHead>{m.reports.sick}</TableHead>
                <TableHead>{m.reports.wfh}</TableHead>
                <TableHead>{m.reports.total}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell>
                    {departmentLabel(row.department, m.departments)}
                  </TableCell>
                  <TableCell className="tabular-nums">{row.annual}</TableCell>
                  <TableCell className="tabular-nums">{row.sick}</TableCell>
                  <TableCell className="tabular-nums">{row.wfh}</TableCell>
                  <TableCell className="tabular-nums font-medium">
                    {row.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>{m.reports.total}</TableCell>
                <TableCell />
                <TableCell className="tabular-nums">{totals.annual}</TableCell>
                <TableCell className="tabular-nums">{totals.sick}</TableCell>
                <TableCell className="tabular-nums">{totals.wfh}</TableCell>
                <TableCell className="tabular-nums">{totals.total}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.reports.approvedAbsences}</CardTitle>
          <CardDescription>{m.reports.approvedBody}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {m.reports.noneThisMonth}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.reports.employee}</TableHead>
                  <TableHead>{m.reports.type}</TableHead>
                  <TableHead>{m.reports.dates}</TableHead>
                  <TableHead>{m.reports.days}</TableHead>
                  <TableHead>{m.reports.reason}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.profile.fullName}
                    </TableCell>
                    <TableCell>
                      <LeaveTypeBadge type={request.leaveType} />
                    </TableCell>
                    <TableCell>
                      {formatRange(request.startDate, request.endDate)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {request.totalDays}
                    </TableCell>
                    <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                      {request.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
