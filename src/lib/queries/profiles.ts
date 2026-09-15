import { createClient } from "@/lib/supabase/server";

export async function listActiveProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listSalespeople() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .in("role", ["admin", "sales"])
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}
