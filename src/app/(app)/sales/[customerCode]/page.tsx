import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalesCustomer } from "@/lib/queries/sales";
import { formatCurrency, formatDate, salesSalespersonName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SalesCustomerPage(props: {
  params: Promise<{ customerCode: string }>;
}) {
  const { customerCode } = await props.params;

  let customer, products, invoices;
  try {
    ({ customer, products, invoices } = await getSalesCustomer(customerCode));
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <Link href="/sales" className="text-sm text-muted-foreground hover:underline">
          &larr; All customers
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{customer.customer_name}</h1>
        <p className="text-sm text-muted-foreground">
          {customer.invoice_count} invoices &middot; {formatDate(customer.first_invoice_date)}{" "}
          &ndash; {formatDate(customer.last_invoice_date)}
        </p>
      </div>

      <Card className="w-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total sales to date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{formatCurrency(customer.total_sales)}</p>
        </CardContent>
      </Card>

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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoice_number}</TableCell>
                    <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {salesSalespersonName(inv.salesperson_code, inv.salesperson_name)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{inv.sale_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.total)}
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
