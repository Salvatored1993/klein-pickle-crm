import { createClient } from "@/lib/supabase/server";

export async function getOverdueFollowups() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_overdue_followups")
    .select("*")
    .order("next_follow_up_date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getOverdueCheckins() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_overdue_checkins")
    .select("*")
    .order("next_checkin_date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPipelineSummary() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_pipeline_summary")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getLeadsBySalesperson() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_leads_by_salesperson")
    .select("*")
    .order("open_estimated_annual_sales", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSamplesOutstanding() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_samples_outstanding")
    .select("*");

  if (error) throw error;
  return data;
}

export async function getQuotesOutstanding() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_quotes_outstanding")
    .select("*");

  if (error) throw error;
  return data;
}

export async function getWonSales() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_won_sales")
    .select("*")
    .order("month", { ascending: true });

  if (error) throw error;
  return data;
}
