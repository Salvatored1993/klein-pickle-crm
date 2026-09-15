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

export async function listCustomersBySalesperson(salespersonId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("salesperson_id", salespersonId)
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

  // Custom (non-catalog) products carry a null product_id and aren't
  // represented in the catalog checklist yet — only surface real ones.
  return {
    customer,
    productIds: customerProducts
      .map((p) => p.product_id)
      .filter((productId): productId is string => productId !== null),
  };
}
