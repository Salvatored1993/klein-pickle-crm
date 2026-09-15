"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type LeadInput = Database["public"]["Tables"]["leads"]["Insert"];

async function syncLeadProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  productIds: string[],
) {
  await supabase.from("lead_products").delete().eq("lead_id", leadId);
  if (productIds.length > 0) {
    const { error } = await supabase
      .from("lead_products")
      .insert(productIds.map((product_id) => ({ lead_id: leadId, product_id })));
    if (error) throw error;
  }
}

export async function createLead(input: LeadInput, productIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;

  await syncLeadProducts(supabase, data.id, productIds);
  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLead(
  id: string,
  input: Partial<LeadInput>,
  productIds: string[],
) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(input).eq("id", id);
  if (error) throw error;

  await syncLeadProducts(supabase, id, productIds);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}
