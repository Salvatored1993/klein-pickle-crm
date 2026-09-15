-- Pack size needs to be tied to each specific product a lead wants, not one
-- flat list for the whole lead (otherwise "Kosher Spears + Sauerkraut" with
-- "16 oz + 5 Gallon" checked has no way to tell which size goes with which
-- product). Move pack sizes onto the lead_products join row instead.

alter table public.lead_products add column pack_sizes pack_size[] not null default '{}';

-- cascade: the same three dashboard views select l.* from leads, so they
-- get dropped along with the column and recreated below.
alter table public.leads drop column pack_sizes cascade;

create or replace view public.dashboard_overdue_followups
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads l
left join public.profiles p on p.id = l.salesperson_id
where l.next_follow_up_date < current_date
  and l.sales_stage not in ('Won', 'Lost');

create or replace view public.dashboard_samples_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads l
left join public.profiles p on p.id = l.salesperson_id
where l.sample_required = true
  and l.sample_trial_status not in ('Approved', 'Trial Passed');

create or replace view public.dashboard_quotes_outstanding
with (security_invoker = true) as
select l.*, p.full_name as salesperson_name
from public.leads l
left join public.profiles p on p.id = l.salesperson_id
where l.sales_stage = 'Quote Submitted';
