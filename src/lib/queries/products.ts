import { createClient } from "@/lib/supabase/server";

export async function listActiveProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("item_number", { ascending: true });

  if (error) throw error;
  return data;
}

// Includes deactivated products, so line items added before a product was
// discontinued still resolve to a real name/item number instead of "Unknown".
export async function listAllProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("item_number", { ascending: true });

  if (error) throw error;
  return data;
}
