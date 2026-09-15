-- Support specialty/one-off orders: a pack size of "Other" (with free text
-- describing it), and a product line that isn't in the catalog at all
-- (a custom name + special specs), on both leads and converted customers.

alter type pack_size add value 'Other';

-- lead_products: product_id becomes optional (null = custom product), so
-- the old (lead_id, product_id) composite key can no longer be the primary
-- key — switch to a surrogate id, keep a partial unique index so a real
-- catalog product still can't be added twice to the same lead.
alter table public.lead_products drop constraint lead_products_pkey;
alter table public.lead_products add column id uuid not null default gen_random_uuid();
alter table public.lead_products add constraint lead_products_pkey primary key (id);
alter table public.lead_products alter column product_id drop not null;
alter table public.lead_products add column custom_product_name text;
alter table public.lead_products add column custom_pack_size text;
alter table public.lead_products add column custom_specs text;
alter table public.lead_products add constraint lead_products_target_check check (
  (product_id is not null and custom_product_name is null)
  or (product_id is null and custom_product_name is not null)
);
create unique index lead_products_lead_product_unique
  on public.lead_products (lead_id, product_id)
  where product_id is not null;

-- customer_products: same shape, minus pack size (customers don't track it).
alter table public.customer_products drop constraint customer_products_pkey;
alter table public.customer_products add column id uuid not null default gen_random_uuid();
alter table public.customer_products add constraint customer_products_pkey primary key (id);
alter table public.customer_products alter column product_id drop not null;
alter table public.customer_products add column custom_product_name text;
alter table public.customer_products add column custom_specs text;
alter table public.customer_products add constraint customer_products_target_check check (
  (product_id is not null and custom_product_name is null)
  or (product_id is null and custom_product_name is not null)
);
create unique index customer_products_customer_product_unique
  on public.customer_products (customer_id, product_id)
  where product_id is not null;
