-- Replace the free-text ship-to field on leads with a structured
-- destination address. Only relevant when freight terms isn't FOB Origin
-- (which ships from Klein Pickle's own facility, so nothing to fill in) —
-- that conditional display lives in the app, not the schema.
--
-- Also adds the broker's name and company alongside the existing
-- commission field, shown when broker_involved is on.

alter table public.leads drop column ship_to_locations cascade;

alter table public.leads add column ship_to_address text;
alter table public.leads add column ship_to_city text;
alter table public.leads add column ship_to_state text;
alter table public.leads add column ship_to_zip text;
alter table public.leads add column ship_to_country text default 'United States';

alter table public.leads add column broker_name text;
alter table public.leads add column broker_company text;

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
