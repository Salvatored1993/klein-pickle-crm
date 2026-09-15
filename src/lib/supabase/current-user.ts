import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type CurrentUser = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
