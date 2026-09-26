import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { listLeads } from "@/lib/queries/leads";
import { formatCurrency, formatDate, isOverdue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const allLeads = await listLeads();
  const open = allLeads.filter((l) => !["Won", "Lost"].includes(l.sales_stage));
  const scoped =
    currentUser.role === "admin"
      ? open
      : open.filter((l) => l.salesperson_id === currentUser.id);

  const sorted = [...scoped].sort((a, b) => {
    if (!a.next_follow_up_date) return 1;
    if (!b.next_follow_up_date) return -1;
    return a.next_follow_up_date.localeCompare(b.next_follow_up_date);
  });

  const overdueCount = sorted.filter((l) => isOverdue(l.next_follow_up_date)).length;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold">
        {currentUser.role === "admin" ? "Open opportunities" : "Your open opportunities"}
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {sorted.length} open
        {overdueCount > 0 ? `, ${overdueCount} overdue for follow-up` : ""} — keep these moving.
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing open right now — nice work.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((lead) => {
            const overdue = isOverdue(lead.next_follow_up_date);
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{lead.company_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.sales_stage} · {formatCurrency(lead.estimated_annual_sales)}
                    </p>
                  </div>
                  <Badge variant={overdue ? "destructive" : "secondary"}>
                    {lead.next_follow_up_date
                      ? `Follow up ${formatDate(lead.next_follow_up_date)}`
                      : "No follow-up set"}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
