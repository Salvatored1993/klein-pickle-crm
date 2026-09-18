"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export async function listProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function setUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    target_user_id: userId,
    new_role: role,
  });
  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function setUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_active", {
    target_user_id: userId,
    new_is_active: isActive,
  });
  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function listProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("item_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createProduct(itemNumber: string, name: string, category: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .insert({ item_number: itemNumber, name, category });
  if (error) throw error;
  revalidatePath("/admin/users");
}

export async function setProductActive(productId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);
  if (error) throw error;
  revalidatePath("/admin/users");
}
