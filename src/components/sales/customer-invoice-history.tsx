"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SalesInvoiceWithItems } from "@/lib/queries/sales";
import { formatCurrency, formatDate, salesSalespersonName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CustomerInvoiceHistory({ invoices }: { invoices: SalesInvoiceWithItems[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Salesperson</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const isOpen = expanded.has(inv.id);
            return (
              <Fragment key={inv.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => toggle(inv.id)}
                >
                  <TableCell className="w-6">
                    {isOpen ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {salesSalespersonName(inv.salespersonCode, inv.salespersonName)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{inv.saleType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(inv.total)}
                  </TableCell>
                </TableRow>
                {isOpen ? (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30 p-0">
                      {inv.items.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          No line items recorded for this invoice.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="pl-8">Product</TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead className="text-right">Extension</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inv.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="pl-8">{item.description}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {item.productCode}
                                </TableCell>
                                <TableCell>
                                  {item.qty} {item.uom ?? ""}
                                </TableCell>
                                <TableCell>
                                  {item.price !== null ? formatCurrency(item.price) : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.extension)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
