import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalesCustomer } from "@/lib/queries/sales";
import { formatCurrency, formatDate } from "@/lib/format";
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
        <h1 className="mt-1 text-2xl font-semibold">{customer.customerName}</h1>
        <p className="text-sm text-muted-foreground">
          {customer.invoiceCount} invoices &middot; {formatDate(customer.firstInvoiceDate)}{" "}
          &ndash; {formatDate(customer.lastInvoiceDate)}
        </p>
      </div>

      <Card className="w-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total sales to date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{formatCurrency(customer.totalSales)}</p>
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
