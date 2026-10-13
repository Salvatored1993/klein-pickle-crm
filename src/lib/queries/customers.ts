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

// Private to the customer's salesperson + admin (RLS).
export async function listCustomerDocuments(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Documents uploaded while this customer was still a lead (e.g. an NDA),
// so they follow the account after conversion.
export async function listConvertedLeadDocuments(customerId: string) {
  const supabase = await createClient();
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id")
    .eq("converted_customer_id", customerId);
  if (leadsError) throw leadsError;
  if (leads.length === 0) return [];

  const { data, error } = await supabase
    .from("lead_documents")
    .select("*")
    .in(
      "lead_id",
      leads.map((l) => l.id),
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
