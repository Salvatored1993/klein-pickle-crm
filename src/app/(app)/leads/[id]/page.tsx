import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { getLead } from "@/lib/queries/leads";
import type { LeadProductLineItem } from "@/app/(app)/leads/actions";
import { listSalespeople, listActiveProfiles } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { listTasksFor, listActivityFor } from "@/lib/queries/collab";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { LeadForm } from "@/components/leads/lead-form";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/collab/task-list";
import { ActivityFeed } from "@/components/collab/activity-feed";
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
  let lineItems: LeadProductLineItem[];
  try {
    ({ lead, lineItems } = await getLead(id));
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
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{lead.company_name}</h1>
        <Button variant="outline" size="sm" render={<Link href={`/leads/${id}/print`} target="_blank" rel="noopener noreferrer" />}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      <Tabs defaultValue="details" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <LeadForm
            mode="edit"
            lead={lead}
            initialLineItems={lineItems}
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
      </Tabs>
    </div>
  );
}
