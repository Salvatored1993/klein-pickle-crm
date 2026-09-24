-- A few accounts already exist as manually-created Customer records
-- (from lead conversion) whose names don't exactly match the ERP
-- name — link them explicitly first so the import below enriches
-- them (preserving their existing notes/tasks/activity) instead of
-- creating a duplicate second record for the same business.
update public.customers set sales_customer_code = 'NichandCo'
  where company_name = 'Nicholas and Company' and sales_customer_code is null;
update public.customers set sales_customer_code = 'AMSE'
  where company_name = 'Ammex Services/Delato Corporation' and sales_customer_code is null;
update public.customers set sales_customer_code = 'ASFO'
  where company_name = 'Alpine Foods California' and sales_customer_code is null;

-- One-time import: creates a real Customer record for every ERP
-- account that has a live salesperson attached (house/unassigned
-- accounts, salesperson_code '90', are intentionally skipped — an
-- admin can create those manually and assign them later if needed).
-- Each customer's salesperson is whichever rep has the highest total
-- sales for that account, so a rep reassignment already applied to
-- sales_invoices is picked up automatically. Safe to re-run: already
-- linked accounts (via sales_customer_code) are skipped.
with per_customer_sp as (
  select customer_code, salesperson_code, sum(total) as sp_total
  from public.sales_invoices
  where salesperson_code <> '90'
  group by customer_code, salesperson_code
),
primary_sp as (
  select distinct on (customer_code) customer_code, salesperson_code
  from per_customer_sp
  order by customer_code, sp_total desc
),
last_sale as (
  select customer_code, max(invoice_date) as last_invoice_date
  from public.sales_invoices
  group by customer_code
)
insert into public.customers (company_name, salesperson_id, sales_customer_code, is_active, last_contact_date)
select
  sc.customer_name,
  p.id,
  sc.customer_code,
  true,
  ls.last_invoice_date
from public.sales_customers sc
join primary_sp ps on ps.customer_code = sc.customer_code
join public.profiles p on p.email = (
  case ps.salesperson_code
    when '5' then 'miguel@kleinpickle.com'
    when '20' then 'larry@kleinpickle.com'
    when '30' then 'cutter@kleinpickle.com'
    when '40' then 'irma@kleinpickle.com'
    else null
  end
)
join last_sale ls on ls.customer_code = sc.customer_code
where not exists (
  select 1 from public.customers c where c.sales_customer_code = sc.customer_code
)
returning company_name, sales_customer_code;
