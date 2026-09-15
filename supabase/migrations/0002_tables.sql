create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role user_role not null default 'sales',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  salesperson_id uuid not null references public.profiles (id),
  company_name text not null,
  primary_contact_name text,
  contact_email text,
  contact_phone text,
  lead_date date not null default current_date,
  lead_source lead_source,
  specific_source text,
  customer_type customer_type,
  pack_size_format text,
  proposed_volume numeric,
  volume_unit text,
  estimated_annual_volume numeric,
  estimated_annual_sales numeric(12, 2),
  target_price numeric(10, 2),
  freight_terms freight_terms,
  ship_to_locations text,
  distributor text,
  broker_involved boolean not null default false,
  broker_commission_pct numeric(5, 2),
  sample_required boolean not null default false,
  sample_trial_status sample_trial_status not null default 'Not Required',
  current_supplier text,
  reason_for_opportunity text,
  expected_start_date date,
  sales_stage sales_stage not null default 'New Lead',
  probability_to_close smallint check (
    probability_to_close is null
    or probability_to_close between 0 and 100
  ),
  next_action text,
  next_follow_up_date date,
  notes text,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_salesperson_id_idx on public.leads (salesperson_id);
create index leads_sales_stage_idx on public.leads (sales_stage);
create index leads_next_follow_up_date_idx on public.leads (next_follow_up_date);

create table public.lead_products (
  lead_id uuid not null references public.leads (id) on delete cascade,
  product_id uuid not null references public.products (id),
  primary key (lead_id, product_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  status task_status not null default 'Open',
  priority task_priority not null default 'Medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index tasks_lead_id_idx on public.tasks (lead_id);
create index tasks_assigned_to_idx on public.tasks (assigned_to);

create table public.lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.profiles (id),
  activity_type activity_type not null default 'comment',
  body text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index lead_activity_lead_id_idx on public.lead_activity (lead_id);
