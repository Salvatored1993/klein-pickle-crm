import { createAdminClient } from "@/lib/supabase/admin";

export type DigestItem = {
  type: "lead" | "customer";
  companyName: string;
  date: string;
  isOverdue: boolean;
  href: string;
};

export type SalespersonDigest = {
  salespersonId: string;
  fullName: string | null;
  email: string;
  items: DigestItem[];
};

// Everything due today or already overdue, grouped by salesperson — the
// email version of the Overdue report + Calendar's "today" view combined.
// Uses the service-role client since this runs with no logged-in user
// (a scheduled cron job) and needs to read across every salesperson.
export async function getDailyDigests(): Promise<SalespersonDigest[]> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: salespeople, error: salespeopleError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .in("role", ["admin", "sales"]);
  if (salespeopleError) throw salespeopleError;

  const { data: leadsRaw, error: leadsError } = await supabase
    .from("leads_with_totals")
    .select("id, company_name, salesperson_id, sales_stage, next_follow_up_date, converted_customer_id")
    .lte("next_follow_up_date", today)
    .not("next_follow_up_date", "is", null)
    .is("converted_customer_id", null);
  if (leadsError) throw leadsError;
  const leads = leadsRaw.filter((l) => !["Won", "Lost"].includes(l.sales_stage));

  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id, company_name, salesperson_id, next_checkin_date")
    .eq("is_active", true)
    .lte("next_checkin_date", today)
    .not("next_checkin_date", "is", null);
  if (customersError) throw customersError;

  return salespeople
    .map((person) => {
      const items: DigestItem[] = [
        ...leads
          .filter((l) => l.salesperson_id === person.id)
          .map((l) => ({
            type: "lead" as const,
            companyName: l.company_name,
            date: l.next_follow_up_date!,
            isOverdue: l.next_follow_up_date! < today,
            href: `/leads/${l.id}`,
          })),
        ...customers
          .filter((c) => c.salesperson_id === person.id)
          .map((c) => ({
            type: "customer" as const,
            companyName: c.company_name,
            date: c.next_checkin_date,
            isOverdue: c.next_checkin_date < today,
            href: `/customers/${c.id}`,
          })),
      ].sort((a, b) => a.date.localeCompare(b.date));

      return {
        salespersonId: person.id,
        fullName: person.full_name,
        email: person.email!,
        items,
      };
    })
    .filter((digest) => digest.items.length > 0 && digest.email);
}
