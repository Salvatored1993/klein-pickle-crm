import Link from "next/link";
import { listSalespeople } from "@/lib/queries/profiles";
import { listLeads } from "@/lib/queries/leads";
import { listCustomers } from "@/lib/queries/customers";
import { formatCurrency, isOverdue } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeamPage() {
  const [salespeople, leads, customers] = await Promise.all([
    listSalespeople(),
    listLeads(),
    listCustomers(),
  ]);

  const rows = salespeople.map((person) => {
    const personLeads = leads.filter((l) => l.salesperson_id === person.id);
    const openLeads = personLeads.filter((l) => !["Won", "Lost"].includes(l.sales_stage));
    const openValue = openLeads.reduce((sum, l) => sum + (l.estimated_annual_sales ?? 0), 0);
    const overdueLeads = openLeads.filter((l) => isOverdue(l.next_follow_up_date)).length;

    const personCustomers = customers.filter((c) => c.salesperson_id === person.id);
    const activeCustomers = personCustomers.filter((c) => c.is_active);
    const overdueCheckins = activeCustomers.filter((c) => isOverdue(c.next_checkin_date)).length;

    return {
      person,
      openLeadsCount: openLeads.length,
      openValue,
      overdueCount: overdueLeads + overdueCheckins,
      activeCustomersCount: activeCustomers.length,
    };
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-semibold">Team</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        See what everyone&apos;s working on. Only the owner or an admin can edit.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ person, openLeadsCount, openValue, overdueCount, activeCustomersCount }) => (
          <Link key={person.id} href={`/team/${person.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{person.full_name ?? person.email}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>
                  {openLeadsCount} open lead{openLeadsCount === 1 ? "" : "s"} ·{" "}
                  {formatCurrency(openValue)}
                </p>
                <p>
                  {activeCustomersCount} active customer{activeCustomersCount === 1 ? "" : "s"}
                </p>
                {overdueCount > 0 ? (
                  <Badge variant="destructive" className="mt-1 w-fit">
                    {overdueCount} overdue
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
