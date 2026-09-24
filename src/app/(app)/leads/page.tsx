import Link from "next/link";
import { listLeads } from "@/lib/queries/leads";
import { listProfiles } from "@/app/(app)/admin/actions";
import { LeadsList } from "@/components/leads/leads-list";
import { Button } from "@/components/ui/button";
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
        <LeadsList leads={leads} profiles={profiles} />
      )}
    </div>
  );
}
