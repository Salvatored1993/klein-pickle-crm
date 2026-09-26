-- Lead details (contact info, commercial terms, stage, notes, etc.) are now
-- private to the owning salesperson and admin. Every salesperson can still
-- see that a lead exists and who owns it (company name + owner), so nobody
-- double-contacts the same company — that was the whole reason visibility
-- was broadened in 0007. Tasks and Activity/comments are unaffected: those
-- stay governed by can_see_lead(), which is intentionally left broad, since
-- cross-department collaboration on assigned tasks/comments is a separate
-- concern from seeing the lead's own detail fields.

-- Direct table access: tightened to owner + admin. Broader "can see this
-- exists" access is granted only through the masking view below, not by
-- reading the table directly (defense in depth — PostgREST exposes every
-- table as an endpoint by default).
drop policy "leads_select" on public.leads;
create policy "leads_select" on public.leads
  for select
  using (public.is_admin() or salesperson_id = auth.uid());

drop policy "lead_products_select" on public.lead_products;
create policy "lead_products_select" on public.lead_products
  for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.leads
      where id = lead_products.lead_id and salesperson_id = auth.uid()
    )
  );

-- leads_with_totals intentionally omits security_invoker, so it runs with
-- the view owner's privileges and can see every row regardless of the
-- tightened table policy above — masking which columns come through is
-- handled explicitly in the select list instead of by RLS. cascade: drops
-- and recreates dashboard_overdue_followups/samples_outstanding/
-- quotes_outstanding, which read from this view unchanged below.
drop view public.leads_with_totals cascade;

create view public.leads_with_totals as
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
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.sales_stage end as sales_stage,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.probability_to_close end as probability_to_close,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.next_action end as next_action,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.next_follow_up_date end as next_follow_up_date,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.notes end as notes,
  case when public.is_admin() or l.salesperson_id = auth.uid() then l.lost_reason end as lost_reason,
  l.converted_customer_id,
  l.created_at,
  l.updated_at,
  case
    when public.is_admin() or l.salesperson_id = auth.uid()
    then coalesce(lt.estimated_annual_sales, 0)
  end as estimated_annual_sales
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
