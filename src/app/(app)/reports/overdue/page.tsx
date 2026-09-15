import Link from "next/link";
import { getOverdueFollowups, getOverdueCheckins } from "@/lib/queries/dashboard";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OverdueReportPage() {
  const [followups, checkins] = await Promise.all([
    getOverdueFollowups(),
    getOverdueCheckins(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Overdue</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Lead follow-ups ({followups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing overdue — nice work.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {followups.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{lead.company_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.salesperson_name} · {lead.sales_stage}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      Due {formatDate(lead.next_follow_up_date)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Customer check-ins ({checkins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every active customer is checked in on schedule.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {checkins.map((customer) => (
                <li key={customer.id}>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{customer.company_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.salesperson_name} · last contact{" "}
                        {formatDate(customer.last_contact_date)}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      Due {formatDate(customer.next_checkin_date)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
