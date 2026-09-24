import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalesCustomer } from "@/lib/queries/sales";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { CustomerOrderInfo } from "@/components/sales/customer-order-info";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const supabase = await createClient();
  const { data: linkedCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("sales_customer_code", customerCode)
    .maybeSingle();

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
        {linkedCustomer ? (
          <Link
            href={`/customers/${linkedCustomer.id}`}
            className="text-sm text-primary hover:underline"
          >
            View this account in Customers &rarr;
          </Link>
        ) : null}
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

      <CustomerOrderInfo products={products} invoices={invoices} />
    </div>
  );
}
