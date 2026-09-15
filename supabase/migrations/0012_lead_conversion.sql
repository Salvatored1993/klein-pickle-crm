-- Tracks whether a lead has already been converted into a customer, so the
-- "convert to customer?" prompt only fires once per lead and can link
-- through to the resulting customer record afterward.

alter table public.leads add column converted_customer_id uuid references public.customers (id);

create or replace view public.leads_with_totals
with (security_invoker = true) as
select
  l.*,
  coalesce(lt.estimated_annual_sales, 0) as estimated_annual_sales
from public.leads l
left join public.lead_totals lt on lt.lead_id = l.id;

create or replace view public.dashboard_overdue_followups
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads_with_totals l
left join public.profiles p on p.id = l.salesperson_id
where l.next_follow_up_date < current_date
  and l.sales_stage not in ('Won', 'Lost');

create or replace view public.dashboard_samples_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads_with_totals l
left join public.profiles p on p.id = l.salesperson_id
where l.sample_required = true
  and l.sample_trial_status not in ('Approved', 'Trial Passed');

create or replace view public.dashboard_quotes_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads_with_totals l
left join public.profiles p on p.id = l.salesperson_id
where l.sales_stage = 'Quote Submitted';
