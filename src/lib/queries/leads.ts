import { createClient } from "@/lib/supabase/server";

export async function listLeads() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getLead(id: string) {
  const supabase = await createClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: leadProducts, error: productsError } = await supabase
    .from("lead_products")
    .select("product_id")
    .eq("lead_id", id);

  if (productsError) throw productsError;

  return { lead, productIds: leadProducts.map((p) => p.product_id) };
}
