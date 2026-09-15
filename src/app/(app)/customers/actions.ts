"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type CustomerInput = Database["public"]["Tables"]["customers"]["Insert"];

async function syncCustomerProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
  productIds: string[],
) {
  await supabase.from("customer_products").delete().eq("customer_id", customerId);
  if (productIds.length > 0) {
    const { error } = await supabase
      .from("customer_products")
      .insert(productIds.map((product_id) => ({ customer_id: customerId, product_id })));
    if (error) throw error;
  }
}

export async function createCustomer(input: CustomerInput, productIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;

  await syncCustomerProducts(supabase, data.id, productIds);
  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
  productIds: string[],
) {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(input).eq("id", id);
  if (error) throw error;

  await syncCustomerProducts(supabase, id, productIds);
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}
