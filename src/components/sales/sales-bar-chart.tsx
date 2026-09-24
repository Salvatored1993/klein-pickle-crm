"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

type ChartDatum = {
  name: string;
  total: number;
};

function formatAxisTick(value: number) {
  if (value === 0) return "$0";
  return `$${Math.round(value / 1000)}k`;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{datum.name}</p>
      <p className="text-muted-foreground">{formatCurrency(datum.total)}</p>
    </div>
  );
}

export function SalesBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis
            tickFormatter={formatAxisTick}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
