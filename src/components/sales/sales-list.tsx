"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SalesInvoiceRow, SalesLineItemRow } from "@/lib/queries/sales";
import { formatCurrency, formatDate, salesSalespersonName } from "@/lib/format";
import { SalesBarChart } from "@/components/sales/sales-bar-chart";
import { SalespersonFilter, ALL_SALESPEOPLE } from "@/components/filters/salesperson-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOP_N = 12;
const CASE_UOM = "CS";

type Metric = "dollars" | "cases";

type Row = {
  customerCode: string;
  customerName: string;
  invoiceCount: number;
  value: number;
  firstDate: string;
  lastDate: string;
};

export function SalesList({
  invoices,
  lineItems,
}: {
  invoices: SalesInvoiceRow[];
  lineItems: SalesLineItemRow[];
}) {
  const [salespersonFilter, setSalespersonFilter] = useState(ALL_SALESPEOPLE);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [metric, setMetric] = useState<Metric>("dollars");

  const salespeople = useMemo(() => {
    const seen = new Map<string, string>();
    for (const inv of invoices) {
      if (inv.salespersonCode && !seen.has(inv.salespersonCode)) {
        seen.set(inv.salespersonCode, salesSalespersonName(inv.salespersonCode, inv.salespersonName));
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name === "House account" ? 1 : b.name === "House account" ? -1 : a.name.localeCompare(b.name),
    );
  }, [invoices]);

  const rows: Row[] = useMemo(() => {
    function inRange(salespersonCode: string | null, date: string) {
      if (salespersonFilter !== ALL_SALESPEOPLE && salespersonCode !== salespersonFilter) {
        return false;
      }
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    }

    const byCustomer = new Map<string, Row>();

    if (metric === "dollars") {
      for (const inv of invoices) {
        if (!inRange(inv.salespersonCode, inv.invoiceDate)) continue;
        const existing = byCustomer.get(inv.customerCode);
        if (existing) {
          existing.invoiceCount += 1;
          existing.value += inv.total;
          if (inv.invoiceDate < existing.firstDate) existing.firstDate = inv.invoiceDate;
          if (inv.invoiceDate > existing.lastDate) existing.lastDate = inv.invoiceDate;
        } else {
          byCustomer.set(inv.customerCode, {
            customerCode: inv.customerCode,
            customerName: inv.customerName,
            invoiceCount: 1,
            value: inv.total,
            firstDate: inv.invoiceDate,
            lastDate: inv.invoiceDate,
          });
        }
      }
    } else {
      const invoiceIdsByCustomer = new Map<string, Set<string>>();
      for (const item of lineItems) {
        if (item.uom !== CASE_UOM) continue;
        if (!inRange(item.salespersonCode, item.invoiceDate)) continue;
        const existing = byCustomer.get(item.customerCode);
        if (existing) {
          existing.value += item.qty;
          if (item.invoiceDate < existing.firstDate) existing.firstDate = item.invoiceDate;
          if (item.invoiceDate > existing.lastDate) existing.lastDate = item.invoiceDate;
        } else {
          byCustomer.set(item.customerCode, {
            customerCode: item.customerCode,
            customerName: item.customerName,
            invoiceCount: 0,
            value: item.qty,
            firstDate: item.invoiceDate,
            lastDate: item.invoiceDate,
          });
        }
        const ids = invoiceIdsByCustomer.get(item.customerCode) ?? new Set();
        ids.add(item.invoiceId);
        invoiceIdsByCustomer.set(item.customerCode, ids);
      }
      for (const row of byCustomer.values()) {
        row.invoiceCount = invoiceIdsByCustomer.get(row.customerCode)?.size ?? 0;
      }
    }

    return Array.from(byCustomer.values()).sort((a, b) => b.value - a.value);
  }, [invoices, lineItems, metric, salespersonFilter, fromDate, toDate]);

  const withValue = rows.filter((r) => r.value > 0);
  const grandTotal = withValue.reduce((sum, r) => sum + r.value, 0);
  const totalInvoices = withValue.reduce((sum, r) => sum + r.invoiceCount, 0);

  const chartData = withValue.slice(0, TOP_N).map((r) => ({
    name: r.customerName.length > 18 ? `${r.customerName.slice(0, 17)}…` : r.customerName,
    total: r.value,
  }));

  const isFiltered = fromDate || toDate;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Metric</Label>
          <Tabs value={metric} onValueChange={(v) => v && setMetric(v as Metric)}>
            <TabsList>
              <TabsTrigger value="dollars">Dollars</TabsTrigger>
              <TabsTrigger value="cases">Cases (CS)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Salesperson</Label>
          <SalespersonFilter
            value={salespersonFilter}
            onChange={setSalespersonFilter}
            salespeople={salespeople}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sales-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="sales-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sales-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="sales-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        {isFiltered ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear dates
          </Button>
        ) : null}
      </div>

      {metric === "cases" ? (
        <p className="text-xs text-muted-foreground">
          Case counts only include line items sold in cases (CS) — pallets, bins, and other units
          are excluded since they aren&apos;t directly comparable.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {metric === "dollars" ? "Total sales" : "Total cases sold"}
              {isFiltered ? " (filtered)" : " to date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metric === "dollars" ? formatCurrency(grandTotal) : grandTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Customers with sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{withValue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalInvoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top {TOP_N} customers by {metric === "dollars" ? "total sales" : "cases sold"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesBarChart data={chartData} valueFormat={metric === "dollars" ? "currency" : "number"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>First sale</TableHead>
                  <TableHead>Last sale</TableHead>
                  <TableHead className="text-right">
                    {metric === "dollars" ? "Total sales" : "Total cases"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withValue.map((r) => (
                  <TableRow key={r.customerCode}>
                    <TableCell>
                      <Link
                        href={`/sales/${r.customerCode}`}
                        className="font-medium hover:underline"
                      >
                        {r.customerName}
                      </Link>
                    </TableCell>
                    <TableCell>{r.invoiceCount}</TableCell>
                    <TableCell>{formatDate(r.firstDate)}</TableCell>
                    <TableCell>{formatDate(r.lastDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {metric === "dollars" ? formatCurrency(r.value) : r.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
