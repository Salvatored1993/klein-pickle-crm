import Link from "next/link";
import { listLeads } from "@/lib/queries/leads";
import { listProfiles } from "@/app/(app)/admin/actions";
import { profileName, formatCurrency, formatDate, isOverdue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export default async function LeadsPage() {
  const [leads, profiles] = await Promise.all([listLeads(), listProfiles()]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Button render={<Link href="/leads/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New lead
        </Button>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No leads yet — add your first one.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Est. annual sales</TableHead>
                  <TableHead>Next follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>{profileName(profiles, lead.salesperson_id)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{lead.sales_stage}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(lead.estimated_annual_sales)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isOverdue(lead.next_follow_up_date) &&
                          !["Won", "Lost"].includes(lead.sales_stage)
                            ? "font-medium text-destructive"
                            : undefined
                        }
                      >
                        {formatDate(lead.next_follow_up_date)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex flex-col gap-1 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{lead.company_name}</span>
                    <Badge variant="secondary">{lead.sales_stage}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {profileName(profiles, lead.salesperson_id)}
                  </span>
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatCurrency(lead.estimated_annual_sales)}</span>
                    <span
                      className={
                        isOverdue(lead.next_follow_up_date) &&
                        !["Won", "Lost"].includes(lead.sales_stage)
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      Follow up {formatDate(lead.next_follow_up_date)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
