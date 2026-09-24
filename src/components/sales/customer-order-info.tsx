import { formatCurrency } from "@/lib/format";
import { CustomerInvoiceHistory } from "@/components/sales/customer-invoice-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesInvoiceWithItems } from "@/lib/queries/sales";

type Product = {
  product_code: string;
  description: string;
  invoice_count: number;
  total_qty: number;
  total_extension: number;
};

// Shared "what they buy" + invoice-history-with-line-items view — used on
// both the standalone Sales customer page and the Orders tab on the CRM's
// own Customer detail page, so reps get the same order history wherever
// they're looking at an account.
export function CustomerOrderInfo({
  products,
  invoices,
}: {
  products: Product[];
  invoices: SalesInvoiceWithItems[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What they buy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Total qty</TableHead>
                  <TableHead className="text-right">Total sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.product_code}>
                    <TableCell>{p.description}</TableCell>
                    <TableCell className="text-muted-foreground">{p.product_code}</TableCell>
                    <TableCell>{p.invoice_count}</TableCell>
                    <TableCell>{p.total_qty}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(p.total_extension)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice history</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click an invoice to see its full line-item detail.
          </p>
        </CardHeader>
        <CardContent>
          <CustomerInvoiceHistory invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  );
}
