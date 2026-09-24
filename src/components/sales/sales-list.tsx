"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { formatCurrency, formatDate, salesSalespersonName } from "@/lib/format";
import { SalesBarChart } from "@/components/sales/sales-bar-chart";
import { SalespersonFilter, ALL_SALESPEOPLE } from "@/components/filters/salesperson-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CustomerTotal = Database["public"]["Views"]["sales_customer_totals"]["Row"];
type BySalesperson = Database["public"]["Views"]["sales_customer_salesperson_totals"]["Row"];

const TOP_N = 12;

type Row = {
  customer_code: string;
  customer_name: string;
  invoice_count: number;
  total_sales: number;
  first_invoice_date: string | null;
  last_invoice_date: string | null;
};

export function SalesList({
  customerTotals,
  bySalesperson,
}: {
  customerTotals: CustomerTotal[];
  bySalesperson: BySalesperson[];
}) {
  const [salespersonFilter, setSalespersonFilter] = useState(ALL_SALESPEOPLE);

  const salespeople = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of bySalesperson) {
      if (row.salesperson_code && !seen.has(row.salesperson_code)) {
        seen.set(
          row.salesperson_code,
          salesSalespersonName(row.salesperson_code, row.salesperson_name),
        );
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name === "House account" ? 1 : b.name === "House account" ? -1 : a.name.localeCompare(b.name),
    );
  }, [bySalesperson]);

  const rows: Row[] = useMemo(() => {
    if (salespersonFilter === ALL_SALESPEOPLE) return customerTotals;
    return bySalesperson
      .filter((r) => r.salesperson_code === salespersonFilter)
      .sort((a, b) => b.total_sales - a.total_sales);
  }, [salespersonFilter, customerTotals, bySalesperson]);

  const withSales = rows.filter((r) => r.total_sales > 0);
  const grandTotal = withSales.reduce((sum, r) => sum + r.total_sales, 0);
  const totalInvoices = withSales.reduce((sum, r) => sum + r.invoice_count, 0);

  const chartData = withSales.slice(0, TOP_N).map((r) => ({
    name: r.customer_name.length > 18 ? `${r.customer_name.slice(0, 17)}…` : r.customer_name,
    total: r.total_sales,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SalespersonFilter
        value={salespersonFilter}
        onChange={setSalespersonFilter}
        salespeople={salespeople}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total sales to date
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
                  <TableRow key={r.customer_code}>
                    <TableCell>
                      <Link
                        href={`/sales/${r.customer_code}`}
                        className="font-medium hover:underline"
                      >
                        {r.customer_name}
                      </Link>
                    </TableCell>
                    <TableCell>{r.invoice_count}</TableCell>
                    <TableCell>{formatDate(r.first_invoice_date)}</TableCell>
                    <TableCell>{formatDate(r.last_invoice_date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.total_sales)}
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
