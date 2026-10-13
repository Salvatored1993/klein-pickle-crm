import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getCustomer,
  listCustomerDocuments,
  listConvertedLeadDocuments,
  getConvertedLeadId,
} from "@/lib/queries/customers";
import { getLead } from "@/lib/queries/leads";
import { listAllProducts } from "@/lib/queries/products";
import { getSalesCustomer } from "@/lib/queries/sales";
import { listSalespeople, listActiveProfiles } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { listTasksFor, listActivityFor } from "@/lib/queries/collab";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CustomerForm } from "@/components/customers/customer-form";
import { TaskList } from "@/components/collab/task-list";
import { ActivityFeed } from "@/components/collab/activity-feed";
import { CheckinForm } from "@/components/customers/checkin-form";
import { DocumentsPanel } from "@/components/collab/documents-panel";
import { LeadSummary } from "@/components/leads/lead-summary";
import { describeActivity } from "@/lib/activity";
import { CustomerOrderInfo } from "@/components/sales/customer-order-info";
import { Badge } from "@/components/ui/badge";
import {
  isOverdue,
  formatDate,
  formatDateTime,
  formatCurrency,
  profileName,
} from "@/lib/format";
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

  // Documents are private to the customer's salesperson and admin.
  const canSeeDocuments =
    currentUser.role === "admin" || currentUser.id === customer.salesperson_id;
  const [documents, leadDocuments] = canSeeDocuments
    ? await Promise.all([listCustomerDocuments(id), listConvertedLeadDocuments(id)])
    : [[], []];

  // "Lead info" tab: everything captured while this account was still a
  // lead (pricing, volumes, broker, samples, notes, history). Same access
  // rule as the documents.
  const convertedLeadId = canSeeDocuments ? await getConvertedLeadId(id) : null;
  const convertedLead = convertedLeadId
    ? await Promise.all([
        getLead(convertedLeadId),
        listAllProducts(),
        listActivityFor({ leadId: convertedLeadId }),
      ]).then(([{ lead, lineItems }, allProducts, leadActivity]) => ({
        lead,
        lineItems,
        allProducts,
        leadActivity,
      }))
    : null;

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
        {canSeeDocuments ? (
          <div className="mb-4">
            <DocumentsPanel
              target={{ customerId: id }}
              documents={documents}
              leadDocuments={leadDocuments}
              profiles={profiles}
            />
          </div>
        ) : null}
        <CheckinForm customerId={id} />

        <Tabs defaultValue="activity" className="mt-4">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            {salesOrderInfo ? <TabsTrigger value="orders">Orders</TabsTrigger> : null}
            <TabsTrigger value="details">Details</TabsTrigger>
            {convertedLead ? <TabsTrigger value="lead-info">Lead info</TabsTrigger> : null}
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
          {convertedLead ? (
            <TabsContent value="lead-info">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Details from when this account was a lead (created{" "}
                  {formatDate(convertedLead.lead.lead_date)}).
                </p>
                <Link
                  href={`/leads/${convertedLead.lead.id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Open original lead &rarr;
                </Link>
              </div>
              <div className="rounded-md border p-4">
                <LeadSummary
                  lead={convertedLead.lead}
                  lineItems={convertedLead.lineItems}
                  products={convertedLead.allProducts}
                  salespersonName={
                    profileName(profiles, convertedLead.lead.salesperson_id) ?? "Unknown"
                  }
                />
              </div>
              {convertedLead.leadActivity.length > 0 ? (
                <div className="mt-4 rounded-md border p-4">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                    Lead history
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {convertedLead.leadActivity.map((item) => (
                      <li key={item.id} className="border-b pb-3 last:border-none last:pb-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">
                            {profileName(profiles, item.author_id) ?? "System"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {describeActivity(item) ?? item.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}
