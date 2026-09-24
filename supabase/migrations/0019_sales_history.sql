-- Historical sales data imported from the accounting system's Customer
-- Invoice Detail Report (accounts receivable's network share, not the
-- CRM's own leads/customers flow). Read-only reference data — no
-- app-facing write path.

create table public.sales_customers (
  customer_code text primary key,
  customer_name text not null
);

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null references public.sales_customers (customer_code),
  invoice_number text not null unique,
  invoice_date date not null,
  sale_type text not null,
  salesperson_code text,
  salesperson_name text,
  total numeric(12, 2) not null,
  source_file text,
  created_at timestamptz not null default now()
);

create index sales_invoices_customer_code_idx on public.sales_invoices (customer_code);
create index sales_invoices_invoice_date_idx on public.sales_invoices (invoice_date);
create index sales_invoices_salesperson_code_idx on public.sales_invoices (salesperson_code);

create table public.sales_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices (id) on delete cascade,
  product_code text not null,
  description text not null,
  qty numeric not null,
  uom text,
  price numeric(10, 2),
  extension numeric(12, 2) not null
);

create index sales_invoice_items_invoice_id_idx on public.sales_invoice_items (invoice_id);
create index sales_invoice_items_product_code_idx on public.sales_invoice_items (product_code);

alter table public.sales_customers enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.sales_invoice_items enable row level security;

-- Company-wide sales history — every authenticated user can read it,
-- matching the broad visibility already granted on leads/customers.
-- No insert/update/delete policies: this table is populated only via
-- migration/import, never through the app.
create policy "sales_customers_select" on public.sales_customers
  for select to authenticated using (true);

create policy "sales_invoices_select" on public.sales_invoices
  for select to authenticated using (true);

create policy "sales_invoice_items_select" on public.sales_invoice_items
  for select to authenticated using (true);

-- Grand total per customer, regardless of salesperson (some customers'
-- invoices span more than one salesperson code over the year).
create view public.sales_customer_totals
  with (security_invoker = true) as
select
  c.customer_code,
  c.customer_name,
  count(i.id) as invoice_count,
  coalesce(sum(i.total), 0) as total_sales,
  min(i.invoice_date) as first_invoice_date,
  max(i.invoice_date) as last_invoice_date
from public.sales_customers c
left join public.sales_invoices i on i.customer_code = c.customer_code
group by c.customer_code, c.customer_name;

-- Per customer, split out by salesperson — a customer with invoices
-- under more than one salesperson code gets one row per code. Code '90'
-- ("Office") represents unassigned/house accounts.
create view public.sales_customer_salesperson_totals
  with (security_invoker = true) as
select
  i.customer_code,
  c.customer_name,
  i.salesperson_code,
  i.salesperson_name,
  count(i.id) as invoice_count,
  sum(i.total) as total_sales,
  min(i.invoice_date) as first_invoice_date,
  max(i.invoice_date) as last_invoice_date
from public.sales_invoices i
join public.sales_customers c on c.customer_code = i.customer_code
group by i.customer_code, c.customer_name, i.salesperson_code, i.salesperson_name;

create view public.sales_customer_products
  with (security_invoker = true) as
select
  i.customer_code,
  it.product_code,
  it.description,
  sum(it.qty) as total_qty,
  sum(it.extension) as total_extension,
  count(distinct i.id) as invoice_count
from public.sales_invoice_items it
join public.sales_invoices i on i.id = it.invoice_id
group by i.customer_code, it.product_code, it.description;
