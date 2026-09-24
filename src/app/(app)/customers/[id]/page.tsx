import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCustomer } from "@/lib/queries/customers";
import { getSalesCustomer } from "@/lib/queries/sales";
import { listSalespeople, listActiveProfiles } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { listTasksFor, listActivityFor } from "@/lib/queries/collab";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CustomerForm } from "@/components/customers/customer-form";
import { TaskList } from "@/components/collab/task-list";
import { ActivityFeed } from "@/components/collab/activity-feed";
import { CheckinForm } from "@/components/customers/checkin-form";
import { CustomerOrderInfo } from "@/components/sales/customer-order-info";
import { Badge } from "@/components/ui/badge";
import { isOverdue, formatDate, formatCurrency } from "@/lib/format";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default async function CustomerDetailPage(
  props: PageProps<"/customers/[id]">,
) {
  const { id } = await props.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  let customer;
  let productIds: string[];
  try {
    ({ customer, productIds } = await getCustomer(id));
  } catch {
    notFound();
  }

  const [salespeople, products, profiles, tasks, activity] = await Promise.all([
    listSalespeople(),
    listActiveProducts(),
    listActiveProfiles(),
    listTasksFor({ customerId: id }),
    listActivityFor({ customerId: id }),
  ]);

  const salesOrderInfo = customer.sales_customer_code
    ? await getSalesCustomer(customer.sales_customer_code).catch(() => null)
    : null;

  const overdue = customer.is_active && isOverdue(customer.next_checkin_date);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{customer.company_name}</h1>
        {overdue ? (
          <Badge variant="destructive">
            Overdue since {formatDate(customer.next_checkin_date)}
          </Badge>
        ) : (
          <Badge variant="secondary">
            Next check-in {formatDate(customer.next_checkin_date)}
          </Badge>
        )}
        {salesOrderInfo ? (
          <Badge variant="secondary">
            {formatCurrency(salesOrderInfo.customer.totalSales)} to date
          </Badge>
        ) : null}
      </div>

      <div className="max-w-3xl">
        <CheckinForm customerId={id} />

        <Tabs defaultValue="activity" className="mt-4">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            {salesOrderInfo ? <TabsTrigger value="orders">Orders</TabsTrigger> : null}
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <ActivityFeed
              target={{ customerId: id }}
              activity={activity}
              profiles={profiles}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <TaskList target={{ customerId: id }} tasks={tasks} profiles={profiles} />
          </TabsContent>
          {salesOrderInfo ? (
            <TabsContent value="orders">
              <div className="mb-3 flex justify-end">
                <Link
                  href={`/sales/${customer.sales_customer_code}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  View full sales record &rarr;
                </Link>
              </div>
              <CustomerOrderInfo
                products={salesOrderInfo.products}
                invoices={salesOrderInfo.invoices}
              />
            </TabsContent>
          ) : null}
          <TabsContent value="details">
            <CustomerForm
              mode="edit"
              customer={customer}
              initialProductIds={productIds}
              salespeople={salespeople}
              products={products}
              currentUser={currentUser}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
