import Link from "next/link";
import { listLeads, listLeadScorecard } from "@/lib/queries/leads";
import { listProfiles } from "@/app/(app)/admin/actions";
import { LeadsList } from "@/components/leads/leads-list";
import { LeadScorecard } from "@/components/leads/lead-scorecard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function LeadsPage() {
  const [leads, profiles, scorecard] = await Promise.all([
    listLeads(),
    listProfiles(),
    listLeadScorecard(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Button render={<Link href="/leads/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New lead
        </Button>
      </div>

      <div className="mb-6">
        <LeadScorecard rows={scorecard} profiles={profiles} />
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leads yet — add your first one.</p>
      ) : (
        <LeadsList leads={leads} profiles={profiles} />
      )}
    </div>
  );
}
