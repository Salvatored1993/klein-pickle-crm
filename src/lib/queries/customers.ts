import { createClient } from "@/lib/supabase/server";

export async function listCustomers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("next_checkin_date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCustomer(id: string) {
  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: customerProducts, error: productsError } = await supabase
    .from("customer_products")
    .select("product_id")
    .eq("customer_id", id);

  if (productsError) throw productsError;

  return { customer, productIds: customerProducts.map((p) => p.product_id) };
}
