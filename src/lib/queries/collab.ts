import { createClient } from "@/lib/supabase/server";

type Target = { leadId?: string; customerId?: string };

export async function listTasksFor({ leadId, customerId }: Target) {
  const supabase = await createClient();
  let query = supabase.from("tasks").select("*").order("created_at", {
    ascending: false,
  });

  query = leadId
    ? query.eq("lead_id", leadId)
    : query.eq("customer_id", customerId!);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listActivityFor({ leadId, customerId }: Target) {
  const supabase = await createClient();
  let query = supabase.from("activity").select("*").order("created_at", {
    ascending: false,
  });

  query = leadId
    ? query.eq("lead_id", leadId)
    : query.eq("customer_id", customerId!);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
