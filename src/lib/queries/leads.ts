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

export async function listLeadsBySalesperson(salespersonId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("salesperson_id", salespersonId)
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
    .select("product_id, pack_sizes")
    .eq("lead_id", id);

  if (productsError) throw productsError;

  return {
    lead,
    lineItems: leadProducts.map((p) => ({
      productId: p.product_id,
      packSizes: p.pack_sizes,
    })),
  };
}
