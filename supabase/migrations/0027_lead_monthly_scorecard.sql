-- 1) Tighten leads_with_totals. Since 0023 it runs with the owner's
--    privileges (to mask detail columns), so the row filter has to live in
--    the view itself: sales + admin see every lead (company/owner/stage
--    etc.), QA/Operations only the leads they collaborate on (same as
--    before 0023), and logged-out requests see nothing.
create or replace view public.leads_with_totals as
select
  l.id,
  l.salesperson_id,
  l.company_name,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.primary_contact_name end as primary_contact_name,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.contact_email end as contact_email,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.contact_phone end as contact_phone,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.lead_date end as lead_date,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.lead_source end as lead_source,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.specific_source end as specific_source,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.customer_type end as customer_type,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.freight_terms end as freight_terms,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.ship_to_address end as ship_to_address,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.ship_to_city end as ship_to_city,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.ship_to_state end as ship_to_state,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.ship_to_zip end as ship_to_zip,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.ship_to_country end as ship_to_country,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.distributor end as distributor,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.broker_involved end as broker_involved,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.broker_commission_pct end as broker_commission_pct,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.broker_name end as broker_name,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.broker_company end as broker_company,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.sample_required end as sample_required,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.sample_trial_status end as sample_trial_status,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.current_supplier end as current_supplier,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.reason_for_opportunity end as reason_for_opportunity,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.expected_start_date end as expected_start_date,
  l.sales_stage,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.probability_to_close end as probability_to_close,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.next_action end as next_action,
  l.next_follow_up_date,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.notes end as notes,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.lost_reason end as lost_reason,
  l.converted_customer_id,
  l.created_at,
  l.updated_at,
  coalesce(lt.estimated_annual_sales, 0) as estimated_annual_sales,
  l.last_contact_date
from public.leads l
left join public.lead_totals lt on lt.lead_id = l.id
where public.is_admin() or public.is_sales() or public.can_see_lead(l.id);

revoke all on public.leads_with_totals from anon;

-- 2) Monthly lead scorecard for the Leads tab: per salesperson per month,
--    how many leads they generated, closed won and closed lost. Counts
--    only — no lead details — so every salesperson can see the whole
--    team's numbers.
--    - Generated month = the lead's "Date lead created" (lead_date).
--    - Won/Lost month = when the lead was last moved into its current
--      Won/Lost stage (from the activity log; falls back to the last edit
--      for older leads). Converted leads still count.
create view public.lead_monthly_scorecard as
with closed as (
  select
    l.salesperson_id,
    l.sales_stage,
    coalesce(
      (select max(a.created_at) from public.activity a
       where a.lead_id = l.id
         and a.activity_type = 'stage_change'
         and a.metadata->>'to_stage' = l.sales_stage::text),
      l.updated_at
    ) as closed_at
  from public.leads l
  where l.sales_stage in ('Won', 'Lost')
),
events as (
  select salesperson_id, date_trunc('month', lead_date)::date as month, 'generated' as kind
  from public.leads
  union all
  select
    salesperson_id,
    date_trunc('month', closed_at at time zone 'America/Phoenix')::date,
    case when sales_stage = 'Won' then 'won' else 'lost' end
  from closed
)
select
  salesperson_id,
  month,
  (count(*) filter (where kind = 'generated'))::int as generated,
  (count(*) filter (where kind = 'won'))::int as won,
  (count(*) filter (where kind = 'lost'))::int as lost
from events
where public.is_admin() or public.is_sales()
group by salesperson_id, month;

revoke all on public.lead_monthly_scorecard from anon;
grant select on public.lead_monthly_scorecard to authenticated;
