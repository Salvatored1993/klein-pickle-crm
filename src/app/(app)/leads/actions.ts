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
    .insert(input)
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
  const { error } = await supabase.from("leads").update(input).eq("id", id);
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

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      salesperson_id: lead.salesperson_id,
      company_name: lead.company_name,
      primary_contact_name: lead.primary_contact_name,
      contact_email: lead.contact_email,
      contact_phone: lead.contact_phone,
      ship_to_locations: lead.ship_to_locations,
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
