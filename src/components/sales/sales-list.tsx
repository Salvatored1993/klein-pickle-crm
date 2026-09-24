"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SalesInvoiceRow } from "@/lib/queries/sales";
import { formatCurrency, formatDate, salesSalespersonName } from "@/lib/format";
import { SalesBarChart } from "@/components/sales/sales-bar-chart";
import { SalespersonFilter, ALL_SALESPEOPLE } from "@/components/filters/salesperson-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOP_N = 12;

type Row = {
  customerCode: string;
  customerName: string;
  invoiceCount: number;
  totalSales: number;
  firstInvoiceDate: string;
  lastInvoiceDate: string;
};

export function SalesList({ invoices }: { invoices: SalesInvoiceRow[] }) {
  const [salespersonFilter, setSalespersonFilter] = useState(ALL_SALESPEOPLE);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (salespersonFilter !== ALL_SALESPEOPLE && inv.salespersonCode !== salespersonFilter) {
        return false;
      }
      if (fromDate && inv.invoiceDate < fromDate) return false;
      if (toDate && inv.invoiceDate > toDate) return false;
      return true;
    });
  }, [invoices, salespersonFilter, fromDate, toDate]);

  const rows: Row[] = useMemo(() => {
    const byCustomer = new Map<string, Row>();
    for (const inv of filteredInvoices) {
      const existing = byCustomer.get(inv.customerCode);
      if (existing) {
        existing.invoiceCount += 1;
        existing.totalSales += inv.total;
        if (inv.invoiceDate < existing.firstInvoiceDate) existing.firstInvoiceDate = inv.invoiceDate;
        if (inv.invoiceDate > existing.lastInvoiceDate) existing.lastInvoiceDate = inv.invoiceDate;
      } else {
        byCustomer.set(inv.customerCode, {
          customerCode: inv.customerCode,
          customerName: inv.customerName,
          invoiceCount: 1,
          totalSales: inv.total,
          firstInvoiceDate: inv.invoiceDate,
          lastInvoiceDate: inv.invoiceDate,
        });
      }
    }
    return Array.from(byCustomer.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredInvoices]);

  const withSales = rows.filter((r) => r.totalSales > 0);
  const grandTotal = withSales.reduce((sum, r) => sum + r.totalSales, 0);
  const totalInvoices = withSales.reduce((sum, r) => sum + r.invoiceCount, 0);

  const chartData = withSales.slice(0, TOP_N).map((r) => ({
    name: r.customerName.length > 18 ? `${r.customerName.slice(0, 17)}…` : r.customerName,
    total: r.totalSales,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
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
        {fromDate || toDate ? (
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total sales{fromDate || toDate ? " (filtered)" : " to date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(grandTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Customers with sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{withSales.length}</p>
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
          <CardTitle className="text-base">Top {TOP_N} customers by total sales</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesBarChart data={chartData} />
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
                  <TableHead className="text-right">Total sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withSales.map((r) => (
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
                    <TableCell>{formatDate(r.firstInvoiceDate)}</TableCell>
                    <TableCell>{formatDate(r.lastInvoiceDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.totalSales)}
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
