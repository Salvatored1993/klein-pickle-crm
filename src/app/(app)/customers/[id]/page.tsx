import { notFound, redirect } from "next/navigation";
import { getCustomer } from "@/lib/queries/customers";
import { listSalespeople, listActiveProfiles } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { listTasksFor, listActivityFor } from "@/lib/queries/collab";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CustomerForm } from "@/components/customers/customer-form";
import { TaskList } from "@/components/collab/task-list";
import { ActivityFeed } from "@/components/collab/activity-feed";
import { ActivityCalendar } from "@/components/collab/activity-calendar";
import { CheckinForm } from "@/components/customers/checkin-form";
import { Badge } from "@/components/ui/badge";
import { isOverdue, formatDate } from "@/lib/format";
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
      </div>

      <div className="max-w-3xl">
        <CheckinForm customerId={id} />

        <Tabs defaultValue="activity" className="mt-4">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <ActivityFeed
              target={{ customerId: id }}
              activity={activity}
              profiles={profiles}
            />
          </TabsContent>
          <TabsContent value="calendar">
            <ActivityCalendar activity={activity} profiles={profiles} />
          </TabsContent>
          <TabsContent value="tasks">
            <TaskList target={{ customerId: id }} tasks={tasks} profiles={profiles} />
          </TabsContent>
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
