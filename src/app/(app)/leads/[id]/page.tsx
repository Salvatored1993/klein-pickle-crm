import { notFound, redirect } from "next/navigation";
import { getLead } from "@/lib/queries/leads";
import { listSalespeople, listActiveProfiles } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { listTasksFor, listActivityFor } from "@/lib/queries/collab";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { LeadForm } from "@/components/leads/lead-form";
import { TaskList } from "@/components/collab/task-list";
import { ActivityFeed } from "@/components/collab/activity-feed";
import { ActivityCalendar } from "@/components/collab/activity-calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default async function LeadDetailPage(props: PageProps<"/leads/[id]">) {
  const { id } = await props.params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  let lead;
  let productIds: string[];
  try {
    ({ lead, productIds } = await getLead(id));
  } catch {
    notFound();
  }

  const [salespeople, products, profiles, tasks, activity] = await Promise.all([
    listSalespeople(),
    listActiveProducts(),
    listActiveProfiles(),
    listTasksFor({ leadId: id }),
    listActivityFor({ leadId: id }),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">{lead.company_name}</h1>

      <Tabs defaultValue="details" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <LeadForm
            mode="edit"
            lead={lead}
            initialProductIds={productIds}
            salespeople={salespeople}
            products={products}
            currentUser={currentUser}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskList target={{ leadId: id }} tasks={tasks} profiles={profiles} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityFeed target={{ leadId: id }} activity={activity} profiles={profiles} />
        </TabsContent>
        <TabsContent value="calendar">
          <ActivityCalendar activity={activity} profiles={profiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
