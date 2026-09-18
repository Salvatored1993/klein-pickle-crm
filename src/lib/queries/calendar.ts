import { createClient } from "@/lib/supabase/server";

export type CalendarItem = {
  id: string;
  type: "lead" | "customer";
  companyName: string;
  date: string;
};

// Admins see the whole team's schedule; salespeople see only their own —
// scope by passing null (admin) or a salesperson id.
export async function listUpcomingForCalendar(
  salespersonId: string | null,
): Promise<CalendarItem[]> {
  const supabase = await createClient();

  let leadsQuery = supabase
    .from("leads_with_totals")
    .select("id, company_name, next_follow_up_date, sales_stage")
    .not("next_follow_up_date", "is", null);
  if (salespersonId) leadsQuery = leadsQuery.eq("salesperson_id", salespersonId);
  const { data: leads, error: leadsError } = await leadsQuery;
  if (leadsError) throw leadsError;

  let customersQuery = supabase
    .from("customers")
    .select("id, company_name, next_checkin_date")
    .eq("is_active", true);
  if (salespersonId) customersQuery = customersQuery.eq("salesperson_id", salespersonId);
  const { data: customers, error: customersError } = await customersQuery;
  if (customersError) throw customersError;

  const leadItems: CalendarItem[] = leads
    .filter((l) => !["Won", "Lost"].includes(l.sales_stage))
    .map((l) => ({
      id: l.id,
      type: "lead",
      companyName: l.company_name,
      date: l.next_follow_up_date!,
    }));

  const customerItems: CalendarItem[] = customers.map((c) => ({
    id: c.id,
    type: "customer",
    companyName: c.company_name,
    date: c.next_checkin_date,
  }));

  return [...leadItems, ...customerItems];
}
