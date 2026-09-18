import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service-role client: bypasses RLS entirely. Only use it in trusted,
// server-only contexts with no logged-in user (e.g. the cron digest, which
// needs to read every salesperson's leads/customers, not just one person's
// scoped view). Never import this from a Client Component or expose the key
// with a NEXT_PUBLIC_ prefix.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
