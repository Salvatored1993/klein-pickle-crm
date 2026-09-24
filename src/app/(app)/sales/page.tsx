import { listSalesCustomerTotals, listSalesCustomerSalespersonTotals } from "@/lib/queries/sales";
import { SalesList } from "@/components/sales/sales-list";

export default async function SalesPage() {
  const [customerTotals, bySalesperson] = await Promise.all([
    listSalesCustomerTotals(),
    listSalesCustomerSalespersonTotals(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales</h1>
        <p className="text-sm text-muted-foreground">
          Historical invoiced sales by customer, imported from the accounting system. Filter by
          salesperson below — unassigned accounts show as House account.
        </p>
      </div>

      <SalesList customerTotals={customerTotals} bySalesperson={bySalesperson} />
    </div>
  );
}
