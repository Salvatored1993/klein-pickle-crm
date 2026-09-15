-- Tracks whether a lead has already been converted into a customer, so the
-- "convert to customer?" prompt only fires once per lead and can link
-- through to the resulting customer record afterward.

alter table public.leads add column converted_customer_id uuid references public.customers (id);

-- CREATE OR REPLACE can't be used here: the new leads.* expansion inserts
-- converted_customer_id before the trailing estimated_annual_sales column,
-- and Postgres only allows appending new columns at the very end of a
-- replaced view. Drop (cascading to the three dashboard views built on top)
-- and recreate all four fresh instead.
drop view if exists public.leads_with_totals cascade;

create view public.leads_with_totals
with (security_invoker = true) as
select
  l.*,
  coalesce(lt.estimated_annual_sales, 0) as estimated_annual_sales
from public.leads l
left join public.lead_totals lt on lt.lead_id = l.id;

create view public.dashboard_overdue_followups
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads_with_totals l
left join public.profiles p on p.id = l.salesperson_id
where l.next_follow_up_date < current_date
  and l.sales_stage not in ('Won', 'Lost');

create view public.dashboard_samples_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads_with_totals l
left join public.profiles p on p.id = l.salesperson_id
where l.sample_required = true
  and l.sample_trial_status not in ('Approved', 'Trial Passed');

create view public.dashboard_quotes_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads_with_totals l
left join public.profiles p on p.id = l.salesperson_id
where l.sales_stage = 'Quote Submitted';
