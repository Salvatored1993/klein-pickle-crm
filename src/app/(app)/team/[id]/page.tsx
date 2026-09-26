import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listLeadsBySalesperson } from "@/lib/queries/leads";
import { listCustomersBySalesperson } from "@/lib/queries/customers";
import { formatCurrency, formatDate, isOverdue, displayName } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeamMemberPage(props: PageProps<"/team/[id]">) {
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: person, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !person) notFound();

  const [leads, customers] = await Promise.all([
    listLeadsBySalesperson(id),
    listCustomersBySalesperson(id),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">
        {displayName(person.full_name, person.email)}&apos;s activity
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {leads.map((lead) => {
                // Masked by leads_with_totals when it isn't the viewer's lead.
                const isPrivate = lead.sales_stage === null;
                const overdue =
                  isOverdue(lead.next_follow_up_date) &&
                  !["Won", "Lost"].includes(lead.sales_stage ?? "");
                return (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{lead.company_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {isPrivate
                            ? "Details private"
                            : `${lead.sales_stage} · ${formatCurrency(lead.estimated_annual_sales)}`}
                        </p>
                      </div>
                      {isPrivate ? null : (
                        <Badge variant={overdue ? "destructive" : "secondary"}>
                          {lead.next_follow_up_date
                            ? `Follow up ${formatDate(lead.next_follow_up_date)}`
                            : "No follow-up set"}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customers ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {customers.map((customer) => {
                const overdue = customer.is_active && isOverdue(customer.next_checkin_date);
                return (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{customer.company_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last contact {formatDate(customer.last_contact_date)}
                        </p>
                      </div>
                      {!customer.is_active ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : (
                        <Badge variant={overdue ? "destructive" : "secondary"}>
                          Next check-in {formatDate(customer.next_checkin_date)}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
