create or replace view public.dashboard_leads_by_salesperson
with (security_invoker = true) as
select
  p.id as salesperson_id,
  p.full_name,
  count(l.id) as total_leads,
  count(l.id) filter (where l.sales_stage not in ('Won', 'Lost')) as open_leads,
  coalesce(
    sum(l.estimated_annual_sales) filter (where l.sales_stage not in ('Won', 'Lost')),
    0
  ) as open_estimated_annual_sales
from public.profiles p
left join public.leads l on l.salesperson_id = p.id
where p.role = 'sales'
group by p.id, p.full_name;

create or replace view public.dashboard_pipeline_summary
with (security_invoker = true) as
select
  count(*) as open_leads,
  coalesce(sum(estimated_annual_sales), 0) as total_estimated_annual_sales,
  coalesce(sum(estimated_annual_sales * coalesce(probability_to_close, 0) / 100.0), 0) as weighted_pipeline
from public.leads
where sales_stage not in ('Won', 'Lost');

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

-- grouped by updated_at as a proxy for "date won" (no dedicated won_at column)
create or replace view public.dashboard_won_sales
with (security_invoker = true) as
select
  to_char(date_trunc('month', updated_at), 'YYYY-MM') as month,
  count(*) as won_count,
  coalesce(sum(estimated_annual_sales), 0) as won_sales
from public.leads
where sales_stage = 'Won'
group by date_trunc('month', updated_at)
order by date_trunc('month', updated_at);
