"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { profileName } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ScorecardRow = Database["public"]["Views"]["lead_monthly_scorecard"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Metric = "generated" | "won" | "lost";

const METRIC_LABEL: Record<Metric, string> = {
  generated: "Leads generated",
  won: "Closed won",
  lost: "Closed lost",
};

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function pct(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function LeadScorecard({ rows, profiles }: { rows: ScorecardRow[]; profiles: Profile[] }) {
  const months = useMemo(() => {
    const keys = new Set(rows.map((r) => r.month));
    keys.add(currentMonthKey());
    return [...keys].sort().reverse();
  }, [rows]);

  const [month, setMonth] = useState(currentMonthKey());
  const [metric, setMetric] = useState<Metric>("generated");

  const { reps, totals } = useMemo(() => {
    const monthRows = rows.filter((r) => r.month === month);
    // Every active salesperson gets a row, even with zero — a blank month
    // is exactly what this is meant to make visible.
    const ids = new Set([
      ...profiles.filter((p) => p.role === "sales" && p.is_active).map((p) => p.id),
      ...monthRows.map((r) => r.salesperson_id),
    ]);
    const reps = [...ids].map((id) => {
      const r = monthRows.find((x) => x.salesperson_id === id);
      return {
        id,
        name: profileName(profiles, id) ?? "Unknown",
        generated: r?.generated ?? 0,
        won: r?.won ?? 0,
        lost: r?.lost ?? 0,
      };
    });
    const totals = {
      generated: reps.reduce((s, r) => s + r.generated, 0),
      won: reps.reduce((s, r) => s + r.won, 0),
      lost: reps.reduce((s, r) => s + r.lost, 0),
    };
    return { reps, totals };
  }, [rows, profiles, month]);

  const ranked = [...reps].sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name));
  const total = totals[metric];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Monthly scorecard</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={month} onValueChange={(v) => v && setMonth(v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue>{(v: string) => monthLabel(v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={metric} onValueChange={(v) => v && setMetric(v as Metric)}>
            <TabsList>
              <TabsTrigger value="generated">Generated</TabsTrigger>
              <TabsTrigger value="won">Closed won</TabsTrigger>
              <TabsTrigger value="lost">Closed lost</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {METRIC_LABEL[metric]} in {monthLabel(month)}:{" "}
            <span className="font-medium text-foreground">{total}</span> — percentage of leads by
            salesperson
          </p>
          {ranked.map((r) => {
            const share = pct(r[metric], total);
            return (
              <div key={r.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">
                    {r[metric]} · <span className="font-medium text-foreground">{share}%</span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Generated</TableHead>
                <TableHead className="text-right">Closed won</TableHead>
                <TableHead className="text-right">Closed lost</TableHead>
                <TableHead className="text-right">Win rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">
                    {r.generated}{" "}
                    <span className="text-muted-foreground">
                      ({pct(r.generated, totals.generated)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.won}{" "}
                    <span className="text-muted-foreground">({pct(r.won, totals.won)}%)</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.lost}{" "}
                    <span className="text-muted-foreground">({pct(r.lost, totals.lost)}%)</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.won + r.lost === 0 ? "—" : `${pct(r.won, r.won + r.lost)}%`}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium">
                <TableCell>Team total</TableCell>
                <TableCell className="text-right">{totals.generated}</TableCell>
                <TableCell className="text-right">{totals.won}</TableCell>
                <TableCell className="text-right">{totals.lost}</TableCell>
                <TableCell className="text-right">
                  {totals.won + totals.lost === 0
                    ? "—"
                    : `${pct(totals.won, totals.won + totals.lost)}%`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated counts by each lead&apos;s &quot;Date lead created.&quot; Won/lost count in the
          month the lead was moved to that stage. Win rate = won ÷ (won + lost).
        </p>
      </CardContent>
    </Card>
  );
}
