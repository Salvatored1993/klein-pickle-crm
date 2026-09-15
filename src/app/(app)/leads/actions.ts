"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, PackSize } from "@/lib/database.types";

export type LeadInput = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadProductLineItem = {
  productId: string;
  packSizes: PackSize[];
  proposedVolume: number | null;
  volumeUnit: string | null;
  estimatedAnnualVolume: number | null;
  estimatedAnnualSales: number | null;
  targetPrice: number | null;
};

// Callers (e.g. the lead form) sometimes seed their state from
// leads_with_totals, a view that adds a computed estimated_annual_sales
// total on top of the real `leads` columns — that field, or anything else
// not an actual column, would make Postgres reject the whole write.
// Whitelist to the real writable columns rather than trusting the shape
// of whatever object comes in.
const LEAD_WRITABLE_FIELDS = [
  "salesperson_id",
  "company_name",
  "primary_contact_name",
  "contact_email",
  "contact_phone",
  "lead_date",
  "lead_source",
  "specific_source",
  "customer_type",
  "freight_terms",
  "ship_to_address",
  "ship_to_city",
  "ship_to_state",
  "ship_to_zip",
  "ship_to_country",
  "distributor",
  "broker_involved",
  "broker_commission_pct",
  "broker_name",
  "broker_company",
  "sample_required",
  "sample_trial_status",
  "current_supplier",
  "reason_for_opportunity",
  "expected_start_date",
  "sales_stage",
  "probability_to_close",
  "next_action",
  "next_follow_up_date",
  "notes",
  "lost_reason",
] as const satisfies readonly (keyof LeadInput)[];

function sanitizeLeadInput(input: Record<string, unknown>): LeadInput {
  const safe: Record<string, unknown> = {};
  for (const key of LEAD_WRITABLE_FIELDS) {
    if (key in input) safe[key] = input[key];
  }
  return safe as LeadInput;
}

async function syncLeadProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  lineItems: LeadProductLineItem[],
) {
  await supabase.from("lead_products").delete().eq("lead_id", leadId);
  if (lineItems.length > 0) {
    const { error } = await supabase.from("lead_products").insert(
      lineItems.map((item) => ({
        lead_id: leadId,
        product_id: item.productId,
        pack_sizes: item.packSizes,
        proposed_volume: item.proposedVolume,
        volume_unit: item.volumeUnit,
        estimated_annual_volume: item.estimatedAnnualVolume,
        estimated_annual_sales: item.estimatedAnnualSales,
        target_price: item.targetPrice,
      })),
    );
    if (error) throw error;
  }
}

export async function createLead(input: LeadInput, lineItems: LeadProductLineItem[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(sanitizeLeadInput(input))
    .select("id")
    .single();

  if (error) throw error;

  await syncLeadProducts(supabase, data.id, lineItems);
  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLead(
  id: string,
  input: Partial<LeadInput>,
  lineItems: LeadProductLineItem[],
) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(sanitizeLeadInput(input)).eq("id", id);
  if (error) throw error;

  await syncLeadProducts(supabase, id, lineItems);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function convertLeadToCustomer(leadId: string) {
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (leadError) throw leadError;

  if (lead.converted_customer_id) {
    return lead.converted_customer_id;
  }

  const shipToLocation = [
    lead.ship_to_address,
    lead.ship_to_city,
    [lead.ship_to_state, lead.ship_to_zip].filter(Boolean).join(" "),
    lead.ship_to_country,
  ]
    .filter(Boolean)
    .join(", ") || null;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      salesperson_id: lead.salesperson_id,
      company_name: lead.company_name,
      primary_contact_name: lead.primary_contact_name,
      contact_email: lead.contact_email,
      contact_phone: lead.contact_phone,
      ship_to_locations: shipToLocation,
      customer_type: lead.customer_type,
      distributor: lead.distributor,
      notes: lead.notes,
    })
    .select("id")
    .single();
  if (customerError) throw customerError;

  const { data: leadProducts, error: productsError } = await supabase
    .from("lead_products")
    .select("product_id")
    .eq("lead_id", leadId);
  if (productsError) throw productsError;

  if (leadProducts.length > 0) {
    const { error: insertError } = await supabase.from("customer_products").insert(
      leadProducts.map((p) => ({ customer_id: customer.id, product_id: p.product_id })),
    );
    if (insertError) throw insertError;
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({ converted_customer_id: customer.id })
    .eq("id", leadId);
  if (updateError) throw updateError;

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/customers");
  revalidatePath(`/customers/${customer.id}`);

  return customer.id;
}
