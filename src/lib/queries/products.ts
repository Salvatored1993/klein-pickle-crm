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
