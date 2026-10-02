-- Leads get a "last contacted" date, like customers already have. It's
-- editable on the lead form and also bumps automatically whenever a
-- comment or check-in is logged on the lead's Activity tab.

alter table public.leads add column last_contact_date date;

-- Backfill from the most recent comment/check-in already logged.
update public.leads l
set last_contact_date = a.last_date
from (
  select lead_id, max(created_at)::date as last_date
  from public.activity
  where lead_id is not null and activity_type in ('comment', 'checkin')
  group by lead_id
) a
where a.lead_id = l.id;

-- security definer: whoever comments (e.g. QA on an assigned task) may not
-- be allowed to update the lead row directly.
create or replace function public.update_lead_last_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.lead_id is not null and new.activity_type in ('comment', 'checkin') then
    update public.leads
    set last_contact_date = greatest(coalesce(last_contact_date, current_date), current_date)
    where id = new.lead_id;
  end if;
  return new;
end;
$$;

create trigger activity_update_lead_last_contact
  after insert on public.activity
  for each row execute function public.update_lead_last_contact();

-- Visible to every salesperson (like stage / follow-up / est. sales).
-- New column goes last so create or replace keeps the dependent views.
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
left join public.lead_totals lt on lt.lead_id = l.id;
