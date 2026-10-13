import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getLead } from "@/lib/queries/leads";
import { listAllProducts } from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createClient } from "@/lib/supabase/server";
import { PrintLeadButton } from "@/components/leads/print-lead-button";
import { displayName, formatDate } from "@/lib/format";
import type { LeadProductLineItem } from "@/app/(app)/leads/actions";
import { LeadSummary } from "@/components/leads/lead-summary";

export default async function LeadPrintPage(props: { params: Promise<{ id: string }> }) {
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
  // Details are masked for anyone but the owner/admin — nothing to print.
  if (currentUser.role !== "admin" && currentUser.id !== lead.salesperson_id) notFound();

  const products = await listAllProducts();

  const supabase = await createClient();
  const { data: salesperson } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", lead.salesperson_id)
    .single();

  const salespersonName = salesperson
    ? displayName(salesperson.full_name, salesperson.email)
    : "Unknown";

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-neutral-900 print:bg-white print:text-black md:p-10">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <Link href={`/leads/${id}`} className="text-sm text-neutral-500 hover:underline">
          &larr; Back to lead
        </Link>
        <PrintLeadButton />
      </div>

      <header className="mb-6 flex items-baseline justify-between border-b border-neutral-300 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Klein Pickle Company — Lead Summary
          </p>
          <h1 className="text-2xl font-semibold">{lead.company_name}</h1>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>Printed {formatDate(new Date().toISOString().slice(0, 10))}</p>
          <p>By {displayName(currentUser.full_name, currentUser.email)}</p>
        </div>
      </header>

      <LeadSummary
        lead={lead}
        lineItems={lineItems}
        products={products}
        salespersonName={salespersonName}
        tone="print"
      />
    </div>
  );
}
