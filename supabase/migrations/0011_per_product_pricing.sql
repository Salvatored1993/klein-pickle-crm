-- Volume and pricing fields need to be tied to each product a lead wants,
-- not one flat set for the whole lead — two products at different prices
-- and volumes otherwise can't be told apart. Move them onto the
-- lead_products join row, and keep a lead-level dollar rollup (sum across
-- its products) for lists/dashboards via a view.

alter table public.lead_products
  add column proposed_volume numeric,
  add column volume_unit text,
  add column estimated_annual_volume numeric,
  add column estimated_annual_sales numeric(12, 2),
  add column target_price numeric(10, 2);

-- cascade: drops dashboard_overdue_followups/samples_outstanding/
-- quotes_outstanding (select l.*) and dashboard_leads_by_salesperson/
-- pipeline_summary/won_sales (reference estimated_annual_sales directly).
-- All six are recreated below.
alter table public.leads
  drop column proposed_volume cascade,
  drop column volume_unit cascade,
  drop column estimated_annual_volume cascade,
  drop column estimated_annual_sales cascade,
  drop column target_price cascade;

create or replace view public.lead_totals
with (security_invoker = true) as
select
  lead_id,
  coalesce(sum(estimated_annual_sales), 0) as estimated_annual_sales
from public.lead_products
group by lead_id;

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

create or replace view public.dashboard_leads_by_salesperson
with (security_invoker = true) as
select
  p.id as salesperson_id,
  p.full_name,
  count(l.id) as total_leads,
  count(l.id) filter (where l.sales_stage not in ('Won', 'Lost')) as open_leads,
  coalesce(
    sum(lt.estimated_annual_sales) filter (where l.sales_stage not in ('Won', 'Lost')),
    0
  ) as open_estimated_annual_sales
from public.profiles p
left join public.leads l on l.salesperson_id = p.id
left join public.lead_totals lt on lt.lead_id = l.id
where p.role = 'sales'
group by p.id, p.full_name;

create or replace view public.dashboard_pipeline_summary
with (security_invoker = true) as
select
  count(*) as open_leads,
  coalesce(sum(lt.estimated_annual_sales), 0) as total_estimated_annual_sales,
  coalesce(
    sum(lt.estimated_annual_sales * coalesce(l.probability_to_close, 0) / 100.0),
    0
  ) as weighted_pipeline
from public.leads l
left join public.lead_totals lt on lt.lead_id = l.id
where l.sales_stage not in ('Won', 'Lost');

create or replace view public.dashboard_won_sales
with (security_invoker = true) as
select
  to_char(date_trunc('month', l.updated_at), 'YYYY-MM') as month,
  count(*) as won_count,
  coalesce(sum(lt.estimated_annual_sales), 0) as won_sales
from public.leads l
left join public.lead_totals lt on lt.lead_id = l.id
where l.sales_stage = 'Won'
group by date_trunc('month', l.updated_at)
order by date_trunc('month', l.updated_at);
