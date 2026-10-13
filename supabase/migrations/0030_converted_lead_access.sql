-- When a lead is converted, its details and documents should follow the
-- account: the customer's current salesperson (who may not be the rep that
-- worked the lead) can now see the original lead's details, product
-- pricing and documents. Admin and the lead's own rep still can, as before.

create or replace function public.can_see_lead_details(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.leads l
    where l.id = target_lead_id
      and (
        l.salesperson_id = auth.uid()
        or exists (
          select 1 from public.customers c
          where c.id = l.converted_customer_id and c.salesperson_id = auth.uid()
        )
      )
  );
$$;

-- Lead documents (0028 policies call this): same rule.
create or replace function public.can_edit_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_see_lead_details(target_lead_id);
$$;

-- Lead product lines (pricing/volumes) for the Lead info tab.
drop policy "lead_products_select" on public.lead_products;
create policy "lead_products_select" on public.lead_products
  for select
  using (public.can_see_lead_details(lead_id));

-- Same columns as before; only the masking rule changes.
create or replace view public.leads_with_totals as
select
  l.id,
  l.salesperson_id,
  l.company_name,
  case when d.ok then l.primary_contact_name end as primary_contact_name,
  case when d.ok then l.contact_email end as contact_email,
  case when d.ok then l.contact_phone end as contact_phone,
  case when d.ok then l.lead_date end as lead_date,
  case when d.ok then l.lead_source end as lead_source,
  case when d.ok then l.specific_source end as specific_source,
  case when d.ok then l.customer_type end as customer_type,
  case when d.ok then l.freight_terms end as freight_terms,
  case when d.ok then l.ship_to_address end as ship_to_address,
  case when d.ok then l.ship_to_city end as ship_to_city,
  case when d.ok then l.ship_to_state end as ship_to_state,
  case when d.ok then l.ship_to_zip end as ship_to_zip,
  case when d.ok then l.ship_to_country end as ship_to_country,
  case when d.ok then l.distributor end as distributor,
  case when d.ok then l.broker_involved end as broker_involved,
  case when d.ok then l.broker_commission_pct end as broker_commission_pct,
  case when d.ok then l.broker_name end as broker_name,
  case when d.ok then l.broker_company end as broker_company,
  case when d.ok then l.sample_required end as sample_required,
  case when d.ok then l.sample_trial_status end as sample_trial_status,
  case when d.ok then l.current_supplier end as current_supplier,
  case when d.ok then l.reason_for_opportunity end as reason_for_opportunity,
  case when d.ok then l.expected_start_date end as expected_start_date,
  l.sales_stage,
  case when d.ok then l.probability_to_close end as probability_to_close,
  case when d.ok then l.next_action end as next_action,
  l.next_follow_up_date,
  case when d.ok then l.notes end as notes,
  case when d.ok then l.lost_reason end as lost_reason,
  l.converted_customer_id,
  l.created_at,
  l.updated_at,
  coalesce(lt.estimated_annual_sales, 0) as estimated_annual_sales,
  l.last_contact_date
from public.leads l
left join public.lead_totals lt on lt.lead_id = l.id
cross join lateral (select public.can_see_lead_details(l.id) as ok) d
where public.is_admin() or public.is_sales() or public.can_see_lead(l.id);
