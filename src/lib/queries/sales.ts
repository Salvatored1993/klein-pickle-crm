import { createClient } from "@/lib/supabase/server";

export async function listSalesCustomerTotals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_customer_totals")
    .select("*")
    .order("total_sales", { ascending: false });

  if (error) throw error;
  return data;
}

// One row per (customer, salesperson) pair — a customer whose invoices span
// more than one salesperson code over the year gets more than one row.
export async function listSalesCustomerSalespersonTotals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_customer_salesperson_totals")
    .select("*")
    .order("total_sales", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSalesCustomer(customerCode: string) {
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("sales_customer_totals")
    .select("*")
    .eq("customer_code", customerCode)
    .single();
  if (customerError) throw customerError;

  const { data: products, error: productsError } = await supabase
    .from("sales_customer_products")
    .select("*")
    .eq("customer_code", customerCode)
    .order("total_extension", { ascending: false });
  if (productsError) throw productsError;

  const { data: invoices, error: invoicesError } = await supabase
    .from("sales_invoices")
    .select(
      "id, invoice_number, invoice_date, sale_type, salesperson_code, salesperson_name, total",
    )
    .eq("customer_code", customerCode)
    .order("invoice_date", { ascending: false });
  if (invoicesError) throw invoicesError;

  return { customer, products, invoices };
}
