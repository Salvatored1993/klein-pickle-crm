"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, PackSize } from "@/lib/database.types";

export type LeadInput = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadProductLineItem = { productId: string; packSizes: PackSize[] };

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
